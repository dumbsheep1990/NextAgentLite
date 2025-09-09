import { coordinator as Nd, isSelection as _v, MosaicClient as Fd, queryFieldInfo as _C, makeClient as kC, Param as gu } from "@uwdata/mosaic-core";
import * as N from "@uwdata/mosaic-sql";
import { column as co, sql as ms, literal as tw, Query as Ps, eq as SC, cast as Sy, row_number as CC, desc as EC, count as MC } from "@uwdata/mosaic-sql";
import * as RC from "@uwdata/vgplot";
import { createAPIContext as TC } from "@uwdata/vgplot";
import { parseSpec as mp, astToDOM as NC } from "@uwdata/mosaic-spec";
const Jn = 2, yp = 4, Pd = 8, Hs = 16, $a = 32, Ml = 64, bp = 128, bi = 256, Zf = 512, en = 1024, _i = 2048, To = 4096, Ai = 8192, Rl = 16384, zd = 32768, Tl = 65536, Cy = 1 << 17, FC = 1 << 18, Dd = 1 << 19, xp = 1 << 20, kv = 1 << 21, wp = 1 << 22, rl = 1 << 23, ia = Symbol("$state"), _p = Symbol("legacy props"), PC = Symbol(""), kp = new class extends Error {
  name = "StaleReactionError";
  message = "The reaction that called `getAbortSignal()` was re-run or destroyed";
}(), Sp = 3, zs = 8, rw = !1;
var Od = Array.isArray, zC = Array.prototype.indexOf, Cp = Array.from, Uu = Object.defineProperty, yo = Object.getOwnPropertyDescriptor, nw = Object.getOwnPropertyDescriptors, DC = Object.prototype, OC = Array.prototype, Ep = Object.getPrototypeOf, Ey = Object.isExtensible;
function ps(t) {
  return typeof t == "function";
}
const Ot = () => {
};
function Mp(t) {
  for (var e = 0; e < t.length; e++)
    t[e]();
}
function LC() {
  var t, e, r = new Promise((n, a) => {
    t = n, e = a;
  });
  return { promise: r, resolve: t, reject: e };
}
function My(t, e) {
  if (Array.isArray(t))
    return t;
  if (!(Symbol.iterator in t))
    return Array.from(t);
  const r = [];
  for (const n of t)
    if (r.push(n), r.length === e) break;
  return r;
}
function iw(t) {
  return t === this.v;
}
function Rp(t, e) {
  return t != t ? e == e : t !== e || t !== null && typeof t == "object" || typeof t == "function";
}
function BC(t, e) {
  return t !== e;
}
function aw(t) {
  return !Rp(t, this.v);
}
function AC() {
  throw new Error("https://svelte.dev/e/await_outside_boundary");
}
function Tp(t) {
  throw new Error("https://svelte.dev/e/lifecycle_outside_component");
}
function qC() {
  throw new Error("https://svelte.dev/e/async_derived_orphan");
}
function jC(t) {
  throw new Error("https://svelte.dev/e/effect_in_teardown");
}
function $C() {
  throw new Error("https://svelte.dev/e/effect_in_unowned_derived");
}
function UC(t) {
  throw new Error("https://svelte.dev/e/effect_orphan");
}
function IC() {
  throw new Error("https://svelte.dev/e/effect_update_depth_exceeded");
}
function HC() {
  throw new Error("https://svelte.dev/e/hydration_failed");
}
function WC(t) {
  throw new Error("https://svelte.dev/e/props_invalid_value");
}
function GC() {
  throw new Error("https://svelte.dev/e/state_descriptors_fixed");
}
function VC() {
  throw new Error("https://svelte.dev/e/state_prototype_fixed");
}
function XC() {
  throw new Error("https://svelte.dev/e/state_unsafe_mutation");
}
function YC() {
  throw new Error("https://svelte.dev/e/svelte_boundary_reset_onerror");
}
let ZC = !1;
const Ld = 1, Bd = 2, ow = 4, KC = 8, JC = 16, QC = 1, eE = 4, tE = 8, rE = 16, nE = 1, iE = 2, aE = 4, lw = 1, oE = 2, sw = "[", Np = "[!", Fp = "]", nl = {}, jr = Symbol(), lE = "http://www.w3.org/1999/xhtml", sE = "@attach";
let Kr = null;
function Ds(t) {
  Kr = t;
}
function Ry(t) {
  return (
    /** @type {T} */
    cw().get(t)
  );
}
function Ty(t, e) {
  return cw().set(t, e), e;
}
function mt(t, e = !1, r) {
  Kr = {
    p: Kr,
    c: null,
    e: null,
    s: t,
    x: null,
    l: null
  };
}
function yt(t) {
  var e = (
    /** @type {ComponentContext} */
    Kr
  ), r = e.e;
  if (r !== null) {
    e.e = null;
    for (var n of r)
      Ow(n);
  }
  return t !== void 0 && (e.x = t), Kr = e.p, t ?? /** @type {T} */
  {};
}
function uw() {
  return !0;
}
function cw(t) {
  return Kr === null && Tp(), Kr.c ??= new Map(uE(Kr) || void 0);
}
function uE(t) {
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
function cE() {
  console.warn("https://svelte.dev/e/select_multiple_invalid_value");
}
function fE() {
  console.warn("https://svelte.dev/e/svelte_boundary_reset_noop");
}
let st = !1;
function Bi(t) {
  st = t;
}
let Et;
function mn(t) {
  if (t === null)
    throw mc(), nl;
  return Et = t;
}
function Ba() {
  return mn(
    /** @type {TemplateNode} */
    /* @__PURE__ */ Wi(Et)
  );
}
function ee(t) {
  if (st) {
    if (/* @__PURE__ */ Wi(Et) !== null)
      throw mc(), nl;
    Et = t;
  }
}
function Pp(t = 1) {
  if (st) {
    for (var e = t, r = Et; e--; )
      r = /** @type {TemplateNode} */
      /* @__PURE__ */ Wi(r);
    Et = r;
  }
}
function Kf() {
  for (var t = 0, e = Et; ; ) {
    if (e.nodeType === zs) {
      var r = (
        /** @type {Comment} */
        e.data
      );
      if (r === Fp) {
        if (t === 0) return e;
        t -= 1;
      } else (r === sw || r === Np) && (t += 1);
    }
    var n = (
      /** @type {TemplateNode} */
      /* @__PURE__ */ Wi(e)
    );
    e.remove(), e = n;
  }
}
function fw(t) {
  if (!t || t.nodeType !== zs)
    throw mc(), nl;
  return (
    /** @type {Comment} */
    t.data
  );
}
function gi(t) {
  if (typeof t != "object" || t === null || ia in t)
    return t;
  const e = Ep(t);
  if (e !== DC && e !== OC)
    return t;
  var r = /* @__PURE__ */ new Map(), n = Od(t), a = /* @__PURE__ */ me(0), o = al, l = (u) => {
    if (al === o)
      return u();
    var c = Ft, f = al;
    Pn(null), Dy(o);
    var h = u();
    return Pn(c), Dy(f), h;
  };
  return n && r.set("length", /* @__PURE__ */ me(
    /** @type {any[]} */
    t.length
  )), new Proxy(
    /** @type {any} */
    t,
    {
      defineProperty(u, c, f) {
        (!("value" in f) || f.configurable === !1 || f.enumerable === !1 || f.writable === !1) && GC();
        var h = r.get(c);
        return h === void 0 ? h = l(() => {
          var d = /* @__PURE__ */ me(f.value);
          return r.set(c, d), d;
        }) : H(h, f.value, !0), !0;
      },
      deleteProperty(u, c) {
        var f = r.get(c);
        if (f === void 0) {
          if (c in u) {
            const h = l(() => /* @__PURE__ */ me(jr));
            r.set(c, h), Ou(a);
          }
        } else
          H(f, jr), Ou(a);
        return !0;
      },
      get(u, c, f) {
        if (c === ia)
          return t;
        var h = r.get(c), d = c in u;
        if (h === void 0 && (!d || yo(u, c)?.writable) && (h = l(() => {
          var m = gi(d ? u[c] : jr), y = /* @__PURE__ */ me(m);
          return y;
        }), r.set(c, h)), h !== void 0) {
          var g = v(h);
          return g === jr ? void 0 : g;
        }
        return Reflect.get(u, c, f);
      },
      getOwnPropertyDescriptor(u, c) {
        var f = Reflect.getOwnPropertyDescriptor(u, c);
        if (f && "value" in f) {
          var h = r.get(c);
          h && (f.value = v(h));
        } else if (f === void 0) {
          var d = r.get(c), g = d?.v;
          if (d !== void 0 && g !== jr)
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
        if (c === ia)
          return !0;
        var f = r.get(c), h = f !== void 0 && f.v !== jr || Reflect.has(u, c);
        if (f !== void 0 || gt !== null && (!h || yo(u, c)?.writable)) {
          f === void 0 && (f = l(() => {
            var g = h ? gi(u[c]) : jr, m = /* @__PURE__ */ me(g);
            return m;
          }), r.set(c, f));
          var d = v(f);
          if (d === jr)
            return !1;
        }
        return h;
      },
      set(u, c, f, h) {
        var d = r.get(c), g = c in u;
        if (n && c === "length")
          for (var m = f; m < /** @type {Source<number>} */
          d.v; m += 1) {
            var y = r.get(m + "");
            y !== void 0 ? H(y, jr) : m in u && (y = l(() => /* @__PURE__ */ me(jr)), r.set(m + "", y));
          }
        if (d === void 0)
          (!g || yo(u, c)?.writable) && (d = l(() => /* @__PURE__ */ me(void 0)), H(d, gi(f)), r.set(c, d));
        else {
          g = d.v !== jr;
          var w = l(() => gi(f));
          H(d, w);
        }
        var x = Reflect.getOwnPropertyDescriptor(u, c);
        if (x?.set && x.set.call(h, f), !g) {
          if (n && typeof c == "string") {
            var _ = (
              /** @type {Source<number>} */
              r.get("length")
            ), S = Number(c);
            Number.isInteger(S) && S >= _.v && H(_, S + 1);
          }
          Ou(a);
        }
        return !0;
      },
      ownKeys(u) {
        v(a);
        var c = Reflect.ownKeys(u).filter((d) => {
          var g = r.get(d);
          return g === void 0 || g.v !== jr;
        });
        for (var [f, h] of r)
          h.v !== jr && !(f in u) && c.push(f);
        return c;
      },
      setPrototypeOf() {
        VC();
      }
    }
  );
}
function Ny(t) {
  try {
    if (t !== null && typeof t == "object" && ia in t)
      return t[ia];
  } catch {
  }
  return t;
}
function dE(t, e) {
  return Object.is(Ny(t), Ny(e));
}
var Sv, dw, hw, vw;
function Cv() {
  if (Sv === void 0) {
    Sv = window, dw = /Firefox/.test(navigator.userAgent);
    var t = Element.prototype, e = Node.prototype, r = Text.prototype;
    hw = yo(e, "firstChild").get, vw = yo(e, "nextSibling").get, Ey(t) && (t.__click = void 0, t.__className = void 0, t.__attributes = null, t.__style = void 0, t.__e = void 0), Ey(r) && (r.__t = void 0);
  }
}
function ki(t = "") {
  return document.createTextNode(t);
}
// @__NO_SIDE_EFFECTS__
function tn(t) {
  return hw.call(t);
}
// @__NO_SIDE_EFFECTS__
function Wi(t) {
  return vw.call(t);
}
function ne(t, e) {
  if (!st)
    return /* @__PURE__ */ tn(t);
  var r = (
    /** @type {TemplateNode} */
    /* @__PURE__ */ tn(Et)
  );
  if (r === null)
    r = Et.appendChild(ki());
  else if (e && r.nodeType !== Sp) {
    var n = ki();
    return r?.before(n), mn(n), n;
  }
  return mn(r), r;
}
function Ie(t, e) {
  if (!st) {
    var r = (
      /** @type {DocumentFragment} */
      /* @__PURE__ */ tn(
        /** @type {Node} */
        t
      )
    );
    return r instanceof Comment && r.data === "" ? /* @__PURE__ */ Wi(r) : r;
  }
  return Et;
}
function oe(t, e = 1, r = !1) {
  let n = st ? Et : t;
  for (var a; e--; )
    a = n, n = /** @type {TemplateNode} */
    /* @__PURE__ */ Wi(n);
  if (!st)
    return n;
  if (r && n?.nodeType !== Sp) {
    var o = ki();
    return n === null ? a?.after(o) : n.before(o), mn(o), o;
  }
  return mn(n), /** @type {TemplateNode} */
  n;
}
function pw(t) {
  t.textContent = "";
}
function Ad() {
  return !1;
}
const hE = /* @__PURE__ */ new WeakMap();
function gw(t) {
  var e = gt;
  if (e === null)
    return Ft.f |= rl, t;
  if ((e.f & zd) === 0) {
    if ((e.f & bp) === 0)
      throw !e.parent && t instanceof Error && mw(t), t;
    e.b.error(t);
  } else
    Iu(t, e);
}
function Iu(t, e) {
  for (; e !== null; ) {
    if ((e.f & bp) !== 0)
      try {
        e.b.error(t);
        return;
      } catch (r) {
        t = r;
      }
    e = e.parent;
  }
  throw t instanceof Error && mw(t), t;
}
function mw(t) {
  const e = hE.get(t);
  e && (Uu(t, "message", {
    value: e.message
  }), Uu(t, "stack", {
    value: e.stack
  }));
}
const vE = typeof requestIdleCallback > "u" ? (t) => setTimeout(t, 1) : requestIdleCallback;
let Hu = [], Wu = [];
function yw() {
  var t = Hu;
  Hu = [], Mp(t);
}
function bw() {
  var t = Wu;
  Wu = [], Mp(t);
}
function Nl(t) {
  Hu.length === 0 && queueMicrotask(yw), Hu.push(t);
}
function pE(t) {
  Wu.length === 0 && vE(bw), Wu.push(t);
}
function gE() {
  Hu.length > 0 && yw(), Wu.length > 0 && bw();
}
function mE(t) {
  let e = 0, r = yl(0), n;
  return () => {
    zE() && (v(r), yc(() => (e === 0 && (n = Gi(() => t(() => Ou(r)))), e += 1, () => {
      Nl(() => {
        e -= 1, e === 0 && (n?.(), n = void 0, Ou(r));
      });
    })));
  };
}
var yE = Tl | Dd | bp;
function bE(t, e, r) {
  new xE(t, e, r);
}
class xE {
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
  #i = null;
  /** @type {Effect | null} */
  #a = null;
  /** @type {Effect | null} */
  #l = null;
  /** @type {DocumentFragment | null} */
  #o = null;
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
  #v = () => {
    this.#c && Ls(this.#c, this.#s);
  };
  #d = mE(() => (this.#c = yl(this.#s), () => {
    this.#c = null;
  }));
  /**
   * @param {TemplateNode} node
   * @param {BoundaryProps} props
   * @param {((anchor: Node) => void)} children
   */
  constructor(e, r, n) {
    this.#e = e, this.#r = r, this.#n = n, this.#t = Et, this.parent = /** @type {Effect} */
    gt.b, this.pending = !!this.#r.pending, this.#u = No(() => {
      gt.b = this, st && Ba();
      const a = this.#r.pending;
      if (st && a)
        this.#a = Zr(() => a(this.#e)), wo.enqueue(() => {
          this.#i = this.#h(() => (wo.ensure(), Zr(() => this.#n(this.#e)))), this.#s > 0 ? this.#p() : (bo(
            /** @type {Effect} */
            this.#a,
            () => {
              this.#a = null;
            }
          ), this.pending = !1);
        });
      else {
        try {
          this.#i = Zr(() => n(this.#e));
        } catch (o) {
          this.error(o);
        }
        this.#s > 0 ? this.#p() : this.pending = !1;
      }
    }, yE), st && (this.#e = Et);
  }
  has_pending_snippet() {
    return !!this.#r.pending;
  }
  /**
   * @param {() => Effect | null} fn
   */
  #h(e) {
    var r = gt, n = Ft, a = Kr;
    ua(this.#u), Pn(this.#u), Ds(this.#u.ctx);
    try {
      return e();
    } catch (o) {
      return gw(o), null;
    } finally {
      ua(r), Pn(n), Ds(a);
    }
  }
  #p() {
    const e = (
      /** @type {(anchor: Node) => void} */
      this.#r.pending
    );
    this.#i !== null && (this.#o = document.createDocumentFragment(), wE(this.#i, this.#o)), this.#a === null && (this.#a = Zr(() => e(this.#e)));
  }
  /** @param {1 | -1} d */
  #g(e) {
    this.#s += e, this.#s === 0 && (this.pending = !1, this.#a && bo(this.#a, () => {
      this.#a = null;
    }), this.#o && (this.#e.before(this.#o), this.#o = null));
  }
  /** @param {1 | -1} d */
  update_pending_count(e) {
    this.has_pending_snippet() ? this.#g(e) : this.parent && this.parent.#g(e), Ev.add(this.#v);
  }
  get_effect_pending() {
    return this.#d(), v(
      /** @type {Source<number>} */
      this.#c
    );
  }
  /** @param {unknown} error */
  error(e) {
    var r = this.#r.onerror;
    let n = this.#r.failed;
    this.#i && (ln(this.#i), this.#i = null), this.#a && (ln(this.#a), this.#a = null), this.#l && (ln(this.#l), this.#l = null), st && (mn(this.#t), Pp(), mn(Kf()));
    var a = !1, o = !1;
    const l = () => {
      if (a) {
        fE();
        return;
      }
      a = !0, o && YC(), this.#s = 0, this.#l !== null && bo(this.#l, () => {
        this.#l = null;
      }), this.pending = !0, this.#i = this.#h(() => (this.#f = !1, Zr(() => this.#n(this.#e)))), this.#s > 0 ? this.#p() : this.pending = !1;
    };
    if (this.#f || !r && !n)
      throw e;
    var u = Ft;
    try {
      Pn(null), o = !0, r?.(e, l), o = !1;
    } catch (c) {
      Iu(c, this.#u && this.#u.parent);
    } finally {
      Pn(u);
    }
    n && Nl(() => {
      this.#l = this.#h(() => {
        this.#f = !0;
        try {
          return Zr(() => {
            n(
              this.#e,
              () => e,
              () => l
            );
          });
        } catch (c) {
          return Iu(
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
function wE(t, e) {
  for (var r = t.nodes_start, n = t.nodes_end; r !== null; ) {
    var a = r === n ? null : (
      /** @type {TemplateNode} */
      /* @__PURE__ */ Wi(r)
    );
    e.append(r), r = a;
  }
}
function _E() {
  for (var t = (
    /** @type {Effect} */
    gt.b
  ); t !== null && !t.has_pending_snippet(); )
    t = t.parent;
  return t === null && AC(), t;
}
// @__NO_SIDE_EFFECTS__
function qd(t) {
  var e = Jn | _i, r = Ft !== null && (Ft.f & Jn) !== 0 ? (
    /** @type {Derived} */
    Ft
  ) : null;
  return gt === null || r !== null && (r.f & bi) !== 0 ? e |= bi : gt.f |= Dd, {
    ctx: Kr,
    deps: null,
    effects: null,
    equals: iw,
    f: e,
    fn: t,
    reactions: null,
    rv: 0,
    v: (
      /** @type {V} */
      jr
    ),
    wv: 0,
    parent: r ?? gt,
    ac: null
  };
}
// @__NO_SIDE_EFFECTS__
function kE(t, e) {
  let r = (
    /** @type {Effect | null} */
    gt
  );
  r === null && qC();
  var n = (
    /** @type {Boundary} */
    r.b
  ), a = (
    /** @type {Promise<V>} */
    /** @type {unknown} */
    void 0
  ), o = yl(
    /** @type {V} */
    jr
  ), l = null, u = !Ft;
  return OE(() => {
    try {
      var c = t();
    } catch (m) {
      c = Promise.reject(m);
    }
    var f = () => c;
    a = l?.then(f, f) ?? Promise.resolve(c), l = a;
    var h = (
      /** @type {Batch} */
      er
    ), d = n.pending;
    u && (n.update_pending_count(1), d || h.increment());
    const g = (m, y = void 0) => {
      l = null, d || h.activate(), y ? y !== kp && (o.f |= rl, Ls(o, y)) : ((o.f & rl) !== 0 && (o.f ^= rl), Ls(o, m)), u && (n.update_pending_count(-1), d || h.decrement()), Sw();
    };
    if (a.then(g, (m) => g(null, m || "unknown")), h)
      return () => {
        queueMicrotask(() => h.neuter());
      };
  }), new Promise((c) => {
    function f(h) {
      function d() {
        h === a ? c(o) : f(a);
      }
      h.then(d, d);
    }
    f(a);
  });
}
// @__NO_SIDE_EFFECTS__
function ie(t) {
  const e = /* @__PURE__ */ qd(t);
  return Rw(e), e;
}
// @__NO_SIDE_EFFECTS__
function xw(t) {
  const e = /* @__PURE__ */ qd(t);
  return e.equals = aw, e;
}
function ww(t) {
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
function SE(t) {
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
function zp(t) {
  var e, r = gt;
  ua(SE(t));
  try {
    ww(t), e = Pw(t);
  } finally {
    ua(r);
  }
  return e;
}
function _w(t) {
  var e = zp(t);
  if (t.equals(e) || (t.v = e, t.wv = Nw()), !Fl)
    if (Os !== null)
      Os.set(t, t.v);
    else {
      var r = (fo || (t.f & bi) !== 0) && t.deps !== null ? To : en;
      Dn(t, r);
    }
}
function kw(t, e, r) {
  const n = qd;
  if (e.length === 0) {
    r(t.map(n));
    return;
  }
  var a = er, o = (
    /** @type {Effect} */
    gt
  ), l = CE(), u = _E();
  Promise.all(e.map((c) => /* @__PURE__ */ kE(c))).then((c) => {
    a?.activate(), l();
    try {
      r([...t.map(n), ...c]);
    } catch (f) {
      (o.f & Rl) === 0 && Iu(f, o);
    }
    a?.deactivate(), Sw();
  }).catch((c) => {
    u.error(c);
  });
}
function CE() {
  var t = gt, e = Ft, r = Kr;
  return function() {
    ua(t), Pn(e), Ds(r);
  };
}
function Sw() {
  ua(null), Pn(null), Ds(null);
}
const mu = /* @__PURE__ */ new Set();
let er = null, Bf = null, Os = null, Ev = /* @__PURE__ */ new Set(), Jf = [];
function Cw() {
  const t = (
    /** @type {() => void} */
    Jf.shift()
  );
  Jf.length > 0 && queueMicrotask(Cw), t();
}
let gl = [], jd = null, Mv = !1, Af = !1;
class wo {
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
  #i = [];
  /**
   * The same as `#async_effects`, but for effects inside a newly-created
   * `<svelte:boundary>` — these do not prevent the batch from committing
   * @type {Effect[]}
   */
  #a = [];
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
  #o = [];
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
    gl = [], Bf = null;
    var r = null;
    if (mu.size > 1) {
      r = /* @__PURE__ */ new Map(), Os = /* @__PURE__ */ new Map();
      for (const [o, l] of this.current)
        r.set(o, { v: o.v, wv: o.wv }), o.v = l;
      for (const o of mu)
        if (o !== this)
          for (const [l, u] of o.#e)
            r.has(l) || (r.set(l, { v: l.v, wv: l.wv }), l.v = u);
    }
    for (const o of e)
      this.#v(o);
    if (this.#i.length === 0 && this.#r === 0) {
      this.#h();
      var n = this.#l, a = this.#o;
      this.#l = [], this.#o = [], this.#s = [], Bf = er, er = null, Fy(n), Fy(a), er === null ? er = this : mu.delete(this), this.#n?.resolve();
    } else
      this.#d(this.#l), this.#d(this.#o), this.#d(this.#s);
    if (r) {
      for (const [o, { v: l, wv: u }] of r)
        o.wv <= u && (o.v = l);
      Os = null;
    }
    for (const o of this.#i)
      Lu(o);
    for (const o of this.#a)
      Lu(o);
    this.#i = [], this.#a = [];
  }
  /**
   * Traverse the effect tree, executing effects or stashing
   * them for later execution as appropriate
   * @param {Effect} root
   */
  #v(e) {
    e.f ^= en;
    for (var r = e.first; r !== null; ) {
      var n = r.f, a = (n & ($a | Ml)) !== 0, o = a && (n & en) !== 0, l = o || (n & Ai) !== 0 || this.skipped_effects.has(r);
      if (!l && r.fn !== null) {
        if (a)
          r.f ^= en;
        else if ((n & en) === 0)
          if ((n & yp) !== 0)
            this.#o.push(r);
          else if ((n & wp) !== 0) {
            var u = r.b?.pending ? this.#a : this.#i;
            u.push(r);
          } else $d(r) && ((r.f & Hs) !== 0 && this.#s.push(r), Lu(r));
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
      ((r.f & _i) !== 0 ? this.#f : this.#c).push(r), Dn(r, en);
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
    er = this;
  }
  deactivate() {
    er = null, Bf = null;
    for (const e of Ev)
      if (Ev.delete(e), e(), er !== null)
        break;
  }
  neuter() {
    this.#u = !0;
  }
  flush() {
    gl.length > 0 ? Ew() : this.#h(), er === this && (this.#r === 0 && mu.delete(this), this.deactivate());
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
        Dn(e, _i), ml(e);
      for (const e of this.#c)
        Dn(e, To), ml(e);
      this.#l = [], this.#o = [], this.flush();
    } else
      this.deactivate();
  }
  /** @param {() => void} fn */
  add_callback(e) {
    this.#t.add(e);
  }
  settled() {
    return (this.#n ??= LC()).promise;
  }
  static ensure() {
    if (er === null) {
      const e = er = new wo();
      mu.add(er), Af || wo.enqueue(() => {
        er === e && e.flush();
      });
    }
    return er;
  }
  /** @param {() => void} task */
  static enqueue(e) {
    Jf.length === 0 && queueMicrotask(Cw), Jf.unshift(e);
  }
}
function EE(t) {
  var e = Af;
  Af = !0;
  try {
    for (var r; ; ) {
      if (gE(), gl.length === 0 && (er?.flush(), gl.length === 0))
        return jd = null, /** @type {T} */
        r;
      Ew();
    }
  } finally {
    Af = e;
  }
}
function Ew() {
  var t = xs;
  Mv = !0;
  try {
    var e = 0;
    for (Py(!0); gl.length > 0; ) {
      var r = wo.ensure();
      if (e++ > 1e3) {
        var n, a;
        ME();
      }
      r.process(gl), il.clear();
    }
  } finally {
    Mv = !1, Py(t), jd = null;
  }
}
function ME() {
  try {
    IC();
  } catch (t) {
    Iu(t, jd);
  }
}
function Fy(t) {
  var e = t.length;
  if (e !== 0) {
    for (var r = 0; r < e; ) {
      var n = t[r++];
      if ((n.f & (Rl | Ai)) === 0 && $d(n)) {
        var a = er ? er.current.size : 0;
        if (Lu(n), n.deps === null && n.first === null && n.nodes_start === null && (n.teardown === null && n.ac === null ? qw(n) : n.fn = null), er !== null && er.current.size > a && (n.f & xp) !== 0)
          break;
      }
    }
    for (; r < e; )
      ml(t[r++]);
  }
}
function ml(t) {
  for (var e = jd = t; e.parent !== null; ) {
    e = e.parent;
    var r = e.f;
    if (Mv && e === gt && (r & Hs) !== 0)
      return;
    if ((r & (Ml | $a)) !== 0) {
      if ((r & en) === 0) return;
      e.f ^= en;
    }
  }
  gl.push(e);
}
const il = /* @__PURE__ */ new Map();
function yl(t, e) {
  var r = {
    f: 0,
    // TODO ideally we could skip this altogether, but it causes type errors
    v: t,
    reactions: null,
    equals: iw,
    rv: 0,
    wv: 0
  };
  return r;
}
// @__NO_SIDE_EFFECTS__
function me(t, e) {
  const r = yl(t);
  return Rw(r), r;
}
// @__NO_SIDE_EFFECTS__
function Dp(t, e = !1, r = !0) {
  const n = yl(t);
  return e || (n.equals = aw), n;
}
function H(t, e, r = !1) {
  Ft !== null && // since we are untracking the function inside `$inspect.with` we need to add this check
  // to ensure we error if state is set inside an inspect effect
  (!zi || (Ft.f & Cy) !== 0) && uw() && (Ft.f & (Jn | Hs | wp | Cy)) !== 0 && !Da?.includes(t) && XC();
  let n = r ? gi(e) : e;
  return Ls(t, n);
}
function Ls(t, e) {
  if (!t.equals(e)) {
    var r = t.v;
    Fl ? il.set(t, e) : il.set(t, r), t.v = e;
    var n = wo.ensure();
    n.capture(t, r), (t.f & Jn) !== 0 && ((t.f & _i) !== 0 && zp(
      /** @type {Derived} */
      t
    ), Dn(t, (t.f & bi) === 0 ? en : To)), t.wv = Nw(), Mw(t, _i), gt !== null && (gt.f & en) !== 0 && (gt.f & ($a | Ml)) === 0 && (fi === null ? RE([t]) : fi.push(t));
  }
  return e;
}
function Ou(t) {
  H(t, t.v + 1);
}
function Mw(t, e) {
  var r = t.reactions;
  if (r !== null)
    for (var n = r.length, a = 0; a < n; a++) {
      var o = r[a], l = o.f, u = (l & _i) === 0;
      u && Dn(o, e), (l & Jn) !== 0 ? Mw(
        /** @type {Derived} */
        o,
        To
      ) : u && ml(
        /** @type {Effect} */
        o
      );
    }
}
let xs = !1;
function Py(t) {
  xs = t;
}
let Fl = !1;
function zy(t) {
  Fl = t;
}
let Ft = null, zi = !1;
function Pn(t) {
  Ft = t;
}
let gt = null;
function ua(t) {
  gt = t;
}
let Da = null;
function Rw(t) {
  Ft !== null && (Da === null ? Da = [t] : Da.push(t));
}
let hn = null, Gn = 0, fi = null;
function RE(t) {
  fi = t;
}
let Tw = 1, Gu = 0, al = Gu;
function Dy(t) {
  al = t;
}
let fo = !1;
function Nw() {
  return ++Tw;
}
function $d(t) {
  var e = t.f;
  if ((e & _i) !== 0)
    return !0;
  if ((e & To) !== 0) {
    var r = t.deps, n = (e & bi) !== 0;
    if (r !== null) {
      var a, o, l = (e & Zf) !== 0, u = n && gt !== null && !fo, c = r.length;
      if ((l || u) && (gt === null || (gt.f & Rl) === 0)) {
        var f = (
          /** @type {Derived} */
          t
        ), h = f.parent;
        for (a = 0; a < c; a++)
          o = r[a], (l || !o?.reactions?.includes(f)) && (o.reactions ??= []).push(f);
        l && (f.f ^= Zf), u && h !== null && (h.f & bi) === 0 && (f.f ^= bi);
      }
      for (a = 0; a < c; a++)
        if (o = r[a], $d(
          /** @type {Derived} */
          o
        ) && _w(
          /** @type {Derived} */
          o
        ), o.wv > t.wv)
          return !0;
    }
    (!n || gt !== null && !fo) && Dn(t, en);
  }
  return !1;
}
function Fw(t, e, r = !0) {
  var n = t.reactions;
  if (n !== null && !Da?.includes(t))
    for (var a = 0; a < n.length; a++) {
      var o = n[a];
      (o.f & Jn) !== 0 ? Fw(
        /** @type {Derived} */
        o,
        e,
        !1
      ) : e === o && (r ? Dn(o, _i) : (o.f & en) !== 0 && Dn(o, To), ml(
        /** @type {Effect} */
        o
      ));
    }
}
function Pw(t) {
  var e = hn, r = Gn, n = fi, a = Ft, o = fo, l = Da, u = Kr, c = zi, f = al, h = t.f;
  hn = /** @type {null | Value[]} */
  null, Gn = 0, fi = null, fo = (h & bi) !== 0 && (zi || !xs || Ft === null), Ft = (h & ($a | Ml)) === 0 ? t : null, Da = null, Ds(t.ctx), zi = !1, al = ++Gu, t.ac !== null && (t.ac.abort(kp), t.ac = null);
  try {
    t.f |= kv;
    var d = (
      /** @type {Function} */
      (0, t.fn)()
    ), g = t.deps;
    if (hn !== null) {
      var m;
      if (Qf(t, Gn), g !== null && Gn > 0)
        for (g.length = Gn + hn.length, m = 0; m < hn.length; m++)
          g[Gn + m] = hn[m];
      else
        t.deps = g = hn;
      if (!fo || // Deriveds that already have reactions can cleanup, so we still add them as reactions
      (h & Jn) !== 0 && /** @type {import('#client').Derived} */
      t.reactions !== null)
        for (m = Gn; m < g.length; m++)
          (g[m].reactions ??= []).push(t);
    } else g !== null && Gn < g.length && (Qf(t, Gn), g.length = Gn);
    if (uw() && fi !== null && !zi && g !== null && (t.f & (Jn | To | _i)) === 0)
      for (m = 0; m < /** @type {Source[]} */
      fi.length; m++)
        Fw(
          fi[m],
          /** @type {Effect} */
          t
        );
    return a !== null && a !== t && (Gu++, fi !== null && (n === null ? n = fi : n.push(.../** @type {Source[]} */
    fi))), (t.f & rl) !== 0 && (t.f ^= rl), d;
  } catch (y) {
    return gw(y);
  } finally {
    t.f ^= kv, hn = e, Gn = r, fi = n, Ft = a, fo = o, Da = l, Ds(u), zi = c, al = f;
  }
}
function TE(t, e) {
  let r = e.reactions;
  if (r !== null) {
    var n = zC.call(r, t);
    if (n !== -1) {
      var a = r.length - 1;
      a === 0 ? r = e.reactions = null : (r[n] = r[a], r.pop());
    }
  }
  r === null && (e.f & Jn) !== 0 && // Destroying a child effect while updating a parent effect can cause a dependency to appear
  // to be unused, when in fact it is used by the currently-updating parent. Checking `new_deps`
  // allows us to skip the expensive work of disconnecting and immediately reconnecting it
  (hn === null || !hn.includes(e)) && (Dn(e, To), (e.f & (bi | Zf)) === 0 && (e.f ^= Zf), ww(
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
      TE(t, r[n]);
}
function Lu(t) {
  var e = t.f;
  if ((e & Rl) === 0) {
    Dn(t, en);
    var r = gt, n = xs;
    gt = t, xs = !0;
    try {
      (e & Hs) !== 0 ? LE(t) : Bw(t), Lw(t);
      var a = Pw(t);
      t.teardown = typeof a == "function" ? a : null, t.wv = Tw;
      var o;
      rw && ZC && (t.f & _i) !== 0 && t.deps;
    } finally {
      xs = n, gt = r;
    }
  }
}
function v(t) {
  var e = t.f, r = (e & Jn) !== 0;
  if (Ft !== null && !zi) {
    var n = gt !== null && (gt.f & Rl) !== 0;
    if (!n && !Da?.includes(t)) {
      var a = Ft.deps;
      if ((Ft.f & kv) !== 0)
        t.rv < Gu && (t.rv = Gu, hn === null && a !== null && a[Gn] === t ? Gn++ : hn === null ? hn = [t] : (!fo || !hn.includes(t)) && hn.push(t));
      else {
        (Ft.deps ??= []).push(t);
        var o = t.reactions;
        o === null ? t.reactions = [Ft] : o.includes(Ft) || o.push(Ft);
      }
    }
  } else if (r && /** @type {Derived} */
  t.deps === null && /** @type {Derived} */
  t.effects === null) {
    var l = (
      /** @type {Derived} */
      t
    ), u = l.parent;
    u !== null && (u.f & bi) === 0 && (l.f ^= bi);
  }
  if (Fl) {
    if (il.has(t))
      return il.get(t);
    if (r) {
      l = /** @type {Derived} */
      t;
      var c = l.v;
      return ((l.f & en) === 0 && l.reactions !== null || zw(l)) && (c = zp(l)), il.set(l, c), c;
    }
  } else if (r) {
    if (l = /** @type {Derived} */
    t, Os?.has(l))
      return Os.get(l);
    $d(l) && _w(l);
  }
  if ((t.f & rl) !== 0)
    throw t.v;
  return t.v;
}
function zw(t) {
  if (t.v === jr) return !0;
  if (t.deps === null) return !1;
  for (const e of t.deps)
    if (il.has(e) || (e.f & Jn) !== 0 && zw(
      /** @type {Derived} */
      e
    ))
      return !0;
  return !1;
}
function Gi(t) {
  var e = zi;
  try {
    return zi = !0, t();
  } finally {
    zi = e;
  }
}
const NE = -7169;
function Dn(t, e) {
  t.f = t.f & NE | e;
}
function FE(t) {
  if (!(typeof t != "object" || !t || t instanceof EventTarget)) {
    if (ia in t)
      Rv(t);
    else if (!Array.isArray(t))
      for (let e in t) {
        const r = t[e];
        typeof r == "object" && r && ia in r && Rv(r);
      }
  }
}
function Rv(t, e = /* @__PURE__ */ new Set()) {
  if (typeof t == "object" && t !== null && // We don't want to traverse DOM elements
  !(t instanceof EventTarget) && !e.has(t)) {
    e.add(t), t instanceof Date && t.getTime();
    for (let n in t)
      try {
        Rv(t[n], e);
      } catch {
      }
    const r = Ep(t);
    if (r !== Object.prototype && r !== Array.prototype && r !== Map.prototype && r !== Set.prototype && r !== Date.prototype) {
      const n = nw(r);
      for (let a in n) {
        const o = n[a].get;
        if (o)
          try {
            o.call(t);
          } catch {
          }
      }
    }
  }
}
function Dw(t) {
  gt === null && Ft === null && UC(), Ft !== null && (Ft.f & bi) !== 0 && gt === null && $C(), Fl && jC();
}
function PE(t, e) {
  var r = e.last;
  r === null ? e.last = e.first = t : (r.next = t, t.prev = r, e.last = t);
}
function va(t, e, r, n = !0) {
  var a = gt;
  a !== null && (a.f & Ai) !== 0 && (t |= Ai);
  var o = {
    ctx: Kr,
    deps: null,
    nodes_start: null,
    nodes_end: null,
    f: t | _i,
    first: null,
    fn: e,
    last: null,
    next: null,
    parent: a,
    b: a && a.b,
    prev: null,
    teardown: null,
    transitions: null,
    wv: 0,
    ac: null
  };
  if (r)
    try {
      Lu(o), o.f |= zd;
    } catch (c) {
      throw ln(o), c;
    }
  else e !== null && ml(o);
  var l = r && o.deps === null && o.first === null && o.nodes_start === null && o.teardown === null && (o.f & Dd) === 0;
  if (!l && n && (a !== null && PE(o, a), Ft !== null && (Ft.f & Jn) !== 0 && (t & Ml) === 0)) {
    var u = (
      /** @type {Derived} */
      Ft
    );
    (u.effects ??= []).push(o);
  }
  return o;
}
function zE() {
  return Ft !== null && !zi;
}
function Op(t) {
  const e = va(Pd, null, !1);
  return Dn(e, en), e.teardown = t, e;
}
function yn(t) {
  Dw();
  var e = (
    /** @type {Effect} */
    gt.f
  ), r = !Ft && (e & $a) !== 0 && (e & zd) === 0;
  if (r) {
    var n = (
      /** @type {ComponentContext} */
      Kr
    );
    (n.e ??= []).push(t);
  } else
    return Ow(t);
}
function Ow(t) {
  return va(yp | xp, t, !1);
}
function et(t) {
  return Dw(), va(Pd | xp, t, !0);
}
function DE(t) {
  wo.ensure();
  const e = va(Ml, t, !0);
  return (r = {}) => new Promise((n) => {
    r.outro ? bo(e, () => {
      ln(e), n(void 0);
    }) : (ln(e), n(void 0));
  });
}
function Ws(t) {
  return va(yp, t, !1);
}
function OE(t) {
  return va(wp | Dd, t, !0);
}
function yc(t, e = 0) {
  return va(Pd | e, t, !0);
}
function Ne(t, e = [], r = []) {
  kw(e, r, (n) => {
    va(Pd, () => t(...n.map(v)), !0);
  });
}
function No(t, e = 0) {
  var r = va(Hs | e, t, !0);
  return r;
}
function Zr(t, e = !0) {
  return va($a, t, !0, e);
}
function Lw(t) {
  var e = t.teardown;
  if (e !== null) {
    const r = Fl, n = Ft;
    zy(!0), Pn(null);
    try {
      e.call(null);
    } finally {
      zy(r), Pn(n);
    }
  }
}
function Bw(t, e = !1) {
  var r = t.first;
  for (t.first = t.last = null; r !== null; ) {
    r.ac?.abort(kp);
    var n = r.next;
    (r.f & Ml) !== 0 ? r.parent = null : ln(r, e), r = n;
  }
}
function LE(t) {
  for (var e = t.first; e !== null; ) {
    var r = e.next;
    (e.f & $a) === 0 && ln(e), e = r;
  }
}
function ln(t, e = !0) {
  var r = !1;
  (e || (t.f & FC) !== 0) && t.nodes_start !== null && t.nodes_end !== null && (Aw(
    t.nodes_start,
    /** @type {TemplateNode} */
    t.nodes_end
  ), r = !0), Bw(t, e && !r), Qf(t, 0), Dn(t, Rl);
  var n = t.transitions;
  if (n !== null)
    for (const o of n)
      o.stop();
  Lw(t);
  var a = t.parent;
  a !== null && a.first !== null && qw(t), t.next = t.prev = t.teardown = t.ctx = t.deps = t.fn = t.nodes_start = t.nodes_end = t.ac = null;
}
function Aw(t, e) {
  for (; t !== null; ) {
    var r = t === e ? null : (
      /** @type {TemplateNode} */
      /* @__PURE__ */ Wi(t)
    );
    t.remove(), t = r;
  }
}
function qw(t) {
  var e = t.parent, r = t.prev, n = t.next;
  r !== null && (r.next = n), n !== null && (n.prev = r), e !== null && (e.first === t && (e.first = n), e.last === t && (e.last = r));
}
function bo(t, e) {
  var r = [];
  Lp(t, r, !0), jw(r, () => {
    ln(t), e && e();
  });
}
function jw(t, e) {
  var r = t.length;
  if (r > 0) {
    var n = () => --r || e();
    for (var a of t)
      a.out(n);
  } else
    e();
}
function Lp(t, e, r) {
  if ((t.f & Ai) === 0) {
    if (t.f ^= Ai, t.transitions !== null)
      for (const l of t.transitions)
        (l.is_global || r) && e.push(l);
    for (var n = t.first; n !== null; ) {
      var a = n.next, o = (n.f & Tl) !== 0 || (n.f & $a) !== 0;
      Lp(n, e, o ? r : !1), n = a;
    }
  }
}
function Bp(t) {
  $w(t, !0);
}
function $w(t, e) {
  if ((t.f & Ai) !== 0) {
    t.f ^= Ai, (t.f & en) === 0 && (Dn(t, _i), ml(t));
    for (var r = t.first; r !== null; ) {
      var n = r.next, a = (r.f & Tl) !== 0 || (r.f & $a) !== 0;
      $w(r, a ? e : !1), r = n;
    }
    if (t.transitions !== null)
      for (const o of t.transitions)
        (o.is_global || e) && o.in();
  }
}
function BE(t, e) {
  if (e) {
    const r = document.body;
    t.autofocus = !0, Nl(() => {
      document.activeElement === r && t.focus();
    });
  }
}
let Oy = !1;
function Uw() {
  Oy || (Oy = !0, document.addEventListener(
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
function Ud(t) {
  var e = Ft, r = gt;
  Pn(null), ua(null);
  try {
    return t();
  } finally {
    Pn(e), ua(r);
  }
}
function AE(t, e, r, n = r) {
  t.addEventListener(e, () => Ud(r));
  const a = t.__on_r;
  a ? t.__on_r = () => {
    a(), n(!0);
  } : t.__on_r = () => n(!0), Uw();
}
const Iw = /* @__PURE__ */ new Set(), Tv = /* @__PURE__ */ new Set();
function Hw(t, e, r, n = {}) {
  function a(o) {
    if (n.capture || Fu.call(e, o), !o.cancelBubble)
      return Ud(() => r?.call(this, o));
  }
  return t.startsWith("pointer") || t.startsWith("touch") || t === "wheel" ? Nl(() => {
    e.addEventListener(t, a, n);
  }) : e.addEventListener(t, a, n), a;
}
function qE(t, e, r, n, a) {
  var o = { capture: n, passive: a }, l = Hw(t, e, r, o);
  (e === document.body || // @ts-ignore
  e === window || // @ts-ignore
  e === document || // Firefox has quirky behavior, it can happen that we still get "canplay" events when the element is already removed
  e instanceof HTMLMediaElement) && Op(() => {
    e.removeEventListener(t, l, o);
  });
}
function Nr(t) {
  for (var e = 0; e < t.length; e++)
    Iw.add(t[e]);
  for (var r of Tv)
    r(t);
}
let Ly = null;
function Fu(t) {
  var e = this, r = (
    /** @type {Node} */
    e.ownerDocument
  ), n = t.type, a = t.composedPath?.() || [], o = (
    /** @type {null | Element} */
    a[0] || t.target
  );
  Ly = t;
  var l = 0, u = Ly === t && t.__root;
  if (u) {
    var c = a.indexOf(u);
    if (c !== -1 && (e === document || e === /** @type {any} */
    window)) {
      t.__root = e;
      return;
    }
    var f = a.indexOf(e);
    if (f === -1)
      return;
    c <= f && (l = c);
  }
  if (o = /** @type {Element} */
  a[l] || t.target, o !== e) {
    Uu(t, "currentTarget", {
      configurable: !0,
      get() {
        return o || r;
      }
    });
    var h = Ft, d = gt;
    Pn(null), ua(null);
    try {
      for (var g, m = []; o !== null; ) {
        var y = o.assignedSlot || o.parentNode || /** @type {any} */
        o.host || null;
        try {
          var w = o["__" + n];
          if (w != null && (!/** @type {any} */
          o.disabled || // DOM could've been updated already by the time this is reached, so we check this as well
          // -> the target could not have been disabled because it emits the event in the first place
          t.target === o))
            if (Od(w)) {
              var [x, ..._] = w;
              x.apply(o, [t, ..._]);
            } else
              w.call(o, t);
        } catch (S) {
          g ? m.push(S) : g = S;
        }
        if (t.cancelBubble || y === e || y === null)
          break;
        o = y;
      }
      if (g) {
        for (let S of m)
          queueMicrotask(() => {
            throw S;
          });
        throw g;
      }
    } finally {
      t.__root = e, delete t.currentTarget, Pn(h), ua(d);
    }
  }
}
function Ap(t) {
  var e = document.createElement("template");
  return e.innerHTML = t.replaceAll("<!>", "<!---->"), e.content;
}
function Kn(t, e) {
  var r = (
    /** @type {Effect} */
    gt
  );
  r.nodes_start === null && (r.nodes_start = t, r.nodes_end = e);
}
// @__NO_SIDE_EFFECTS__
function _e(t, e) {
  var r = (e & lw) !== 0, n = (e & oE) !== 0, a, o = !t.startsWith("<!>");
  return () => {
    if (st)
      return Kn(Et, null), Et;
    a === void 0 && (a = Ap(o ? t : "<!>" + t), r || (a = /** @type {Node} */
    /* @__PURE__ */ tn(a)));
    var l = (
      /** @type {TemplateNode} */
      n || dw ? document.importNode(a, !0) : a.cloneNode(!0)
    );
    if (r) {
      var u = (
        /** @type {TemplateNode} */
        /* @__PURE__ */ tn(l)
      ), c = (
        /** @type {TemplateNode} */
        l.lastChild
      );
      Kn(u, c);
    } else
      Kn(l, l);
    return l;
  };
}
// @__NO_SIDE_EFFECTS__
function jE(t, e, r = "svg") {
  var n = !t.startsWith("<!>"), a = (e & lw) !== 0, o = `<${r}>${n ? t : "<!>" + t}</${r}>`, l;
  return () => {
    if (st)
      return Kn(Et, null), Et;
    if (!l) {
      var u = (
        /** @type {DocumentFragment} */
        Ap(o)
      ), c = (
        /** @type {Element} */
        /* @__PURE__ */ tn(u)
      );
      if (a)
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
    if (a) {
      var h = (
        /** @type {TemplateNode} */
        /* @__PURE__ */ tn(f)
      ), d = (
        /** @type {TemplateNode} */
        f.lastChild
      );
      Kn(h, d);
    } else
      Kn(f, f);
    return f;
  };
}
// @__NO_SIDE_EFFECTS__
function xt(t, e) {
  return /* @__PURE__ */ jE(t, e, "svg");
}
function Fn(t = "") {
  if (!st) {
    var e = ki(t + "");
    return Kn(e, e), e;
  }
  var r = Et;
  return r.nodeType !== Sp && (r.before(r = ki()), mn(r)), Kn(r, r), r;
}
function dr() {
  if (st)
    return Kn(Et, null), Et;
  var t = document.createDocumentFragment(), e = document.createComment(""), r = ki();
  return t.append(e, r), Kn(e, r), t;
}
function te(t, e) {
  if (st) {
    gt.nodes_end = Et, Ba();
    return;
  }
  t !== null && t.before(
    /** @type {Node} */
    e
  );
}
function $E(t) {
  return t.endsWith("capture") && t !== "gotpointercapture" && t !== "lostpointercapture";
}
const UE = [
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
function IE(t) {
  return UE.includes(t);
}
const HE = {
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
function WE(t) {
  return t = t.toLowerCase(), HE[t] ?? t;
}
const GE = ["touchstart", "touchmove"];
function VE(t) {
  return GE.includes(t);
}
let Nv = !0;
function it(t, e) {
  var r = e == null ? "" : typeof e == "object" ? e + "" : e;
  r !== (t.__t ??= t.nodeValue) && (t.__t = r, t.nodeValue = r + "");
}
function Ww(t, e) {
  return Gw(t, e);
}
function XE(t, e) {
  Cv(), e.intro = e.intro ?? !1;
  const r = e.target, n = st, a = Et;
  try {
    for (var o = (
      /** @type {TemplateNode} */
      /* @__PURE__ */ tn(r)
    ); o && (o.nodeType !== zs || /** @type {Comment} */
    o.data !== sw); )
      o = /** @type {TemplateNode} */
      /* @__PURE__ */ Wi(o);
    if (!o)
      throw nl;
    Bi(!0), mn(
      /** @type {Comment} */
      o
    ), Ba();
    const l = Gw(t, { ...e, anchor: o });
    if (Et === null || Et.nodeType !== zs || /** @type {Comment} */
    Et.data !== Fp)
      throw mc(), nl;
    return Bi(!1), /**  @type {Exports} */
    l;
  } catch (l) {
    if (l === nl)
      return e.recover === !1 && HC(), Cv(), pw(r), Bi(!1), Ww(t, e);
    throw l;
  } finally {
    Bi(n), mn(a);
  }
}
const cs = /* @__PURE__ */ new Map();
function Gw(t, { target: e, anchor: r, props: n = {}, events: a, context: o, intro: l = !0 }) {
  Cv();
  var u = /* @__PURE__ */ new Set(), c = (d) => {
    for (var g = 0; g < d.length; g++) {
      var m = d[g];
      if (!u.has(m)) {
        u.add(m);
        var y = VE(m);
        e.addEventListener(m, Fu, { passive: y });
        var w = cs.get(m);
        w === void 0 ? (document.addEventListener(m, Fu, { passive: y }), cs.set(m, 1)) : cs.set(m, w + 1);
      }
    }
  };
  c(Cp(Iw)), Tv.add(c);
  var f = void 0, h = DE(() => {
    var d = r ?? e.appendChild(ki());
    return Zr(() => {
      if (o) {
        mt({});
        var g = (
          /** @type {ComponentContext} */
          Kr
        );
        g.c = o;
      }
      a && (n.$$events = a), st && Kn(
        /** @type {TemplateNode} */
        d,
        null
      ), Nv = l, f = t(d, n) || {}, Nv = !0, st && (gt.nodes_end = Et), o && yt();
    }), () => {
      for (var g of u) {
        e.removeEventListener(g, Fu);
        var m = (
          /** @type {number} */
          cs.get(g)
        );
        --m === 0 ? (document.removeEventListener(g, Fu), cs.delete(g)) : cs.set(g, m);
      }
      Tv.delete(c), d !== r && d.parentNode?.removeChild(d);
    };
  });
  return Fv.set(f, h), f;
}
let Fv = /* @__PURE__ */ new WeakMap();
function YE(t, e) {
  const r = Fv.get(t);
  return r ? (Fv.delete(t), r(e)) : Promise.resolve();
}
function Vw(t) {
  return new ZE(t);
}
class ZE {
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
    var r = /* @__PURE__ */ new Map(), n = (o, l) => {
      var u = /* @__PURE__ */ Dp(l, !1, !1);
      return r.set(o, u), u;
    };
    const a = new Proxy(
      { ...e.props || {}, $$events: {} },
      {
        get(o, l) {
          return v(r.get(l) ?? n(l, Reflect.get(o, l)));
        },
        has(o, l) {
          return l === _p ? !0 : (v(r.get(l) ?? n(l, Reflect.get(o, l))), Reflect.has(o, l));
        },
        set(o, l, u) {
          return H(r.get(l) ?? n(l, u), u), Reflect.set(o, l, u);
        }
      }
    );
    this.#t = (e.hydrate ? XE : Ww)(e.component, {
      target: e.target,
      anchor: e.anchor,
      props: a,
      context: e.context,
      intro: e.intro ?? !1,
      recover: e.recover
    }), (!e?.props?.$$host || e.sync === !1) && EE(), this.#e = a.$$events;
    for (const o of Object.keys(this.#t))
      o === "$set" || o === "$destroy" || o === "$on" || Uu(this, o, {
        get() {
          return this.#t[o];
        },
        /** @param {any} value */
        set(l) {
          this.#t[o] = l;
        },
        enumerable: !0
      });
    this.#t.$set = /** @param {Record<string, any>} next */
    (o) => {
      Object.assign(a, o);
    }, this.#t.$destroy = () => {
      YE(this.#t);
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
    const n = (...a) => r.call(this, ...a);
    return this.#e[e].push(n), () => {
      this.#e[e] = this.#e[e].filter(
        /** @param {any} fn */
        (a) => a !== n
      );
    };
  }
  $destroy() {
    this.#t.$destroy();
  }
}
const KE = "5";
typeof window < "u" && ((window.__svelte ??= {}).v ??= /* @__PURE__ */ new Set()).add(KE);
function Vu(t, e, ...r) {
  var n = t, a = Ot, o;
  No(() => {
    a !== (a = e()) && (o && (ln(o), o = null), o = Zr(() => (
      /** @type {SnippetFn} */
      a(n, ...r)
    )));
  }, Tl), st && (n = Et);
}
function bc(t) {
  Kr === null && Tp(), yn(() => {
    const e = Gi(t);
    if (typeof e == "function") return (
      /** @type {() => void} */
      e
    );
  });
}
function Xw(t) {
  Kr === null && Tp(), bc(() => () => Gi(t));
}
function Fe(t, e, r = !1) {
  st && Ba();
  var n = t, a = null, o = null, l = jr, u = r ? Tl : 0, c = !1;
  const f = (m, y = !0) => {
    c = !0, g(y, m);
  };
  var h = null;
  function d() {
    h !== null && (h.lastChild.remove(), n.before(h), h = null);
    var m = l ? a : o, y = l ? o : a;
    m && Bp(m), y && bo(y, () => {
      l ? o = null : a = null;
    });
  }
  const g = (m, y) => {
    if (l === (l = m)) return;
    let w = !1;
    if (st) {
      const E = fw(n) === Np;
      !!l === E && (n = Kf(), mn(n), Bi(!1), w = !0);
    }
    var x = Ad(), _ = n;
    if (x && (h = document.createDocumentFragment(), h.append(_ = ki())), l ? a ??= y && Zr(() => y(_)) : o ??= y && Zr(() => y(_)), x) {
      var S = (
        /** @type {Batch} */
        er
      ), k = l ? a : o, T = l ? o : a;
      k && S.skipped_effects.delete(k), T && S.skipped_effects.add(T), S.add_callback(d);
    } else
      d();
    w && Bi(!0);
  };
  No(() => {
    c = !1, e(f), c || g(null, null);
  }, u), st && (n = Et);
}
function Id(t, e, r) {
  st && Ba();
  var n = t, a = jr, o, l, u = null, c = BC;
  function f() {
    o && bo(o), u !== null && (u.lastChild.remove(), n.before(u), u = null), o = l;
  }
  No(() => {
    if (c(a, a = e())) {
      var h = n, d = Ad();
      d && (u = document.createDocumentFragment(), u.append(h = ki())), l = Zr(() => r(h)), d ? er.add_callback(f) : f();
    }
  }), st && (n = Et);
}
let qf = null;
function or(t, e) {
  return e;
}
function JE(t, e, r) {
  for (var n = t.items, a = [], o = e.length, l = 0; l < o; l++)
    Lp(e[l].e, a, !0);
  var u = o > 0 && a.length === 0 && r !== null;
  if (u) {
    var c = (
      /** @type {Element} */
      /** @type {Element} */
      r.parentNode
    );
    pw(c), c.append(
      /** @type {Element} */
      r
    ), n.clear(), Ji(t, e[0].prev, e[o - 1].next);
  }
  jw(a, () => {
    for (var f = 0; f < o; f++) {
      var h = e[f];
      u || (n.delete(h.k), Ji(t, h.prev, h.next)), ln(h.e, !u);
    }
  });
}
function Xt(t, e, r, n, a, o = null) {
  var l = t, u = { flags: e, items: /* @__PURE__ */ new Map(), first: null }, c = (e & ow) !== 0;
  if (c) {
    var f = (
      /** @type {Element} */
      t
    );
    l = st ? mn(
      /** @type {Comment | Text} */
      /* @__PURE__ */ tn(f)
    ) : f.appendChild(ki());
  }
  st && Ba();
  var h = null, d = !1, g = /* @__PURE__ */ new Map(), m = /* @__PURE__ */ xw(() => {
    var _ = r();
    return Od(_) ? _ : _ == null ? [] : Cp(_);
  }), y, w;
  function x() {
    QE(
      w,
      y,
      u,
      g,
      l,
      a,
      e,
      n,
      r
    ), o !== null && (y.length === 0 ? h ? Bp(h) : h = Zr(() => o(l)) : h !== null && bo(h, () => {
      h = null;
    }));
  }
  No(() => {
    w ??= /** @type {Effect} */
    gt, y = v(m);
    var _ = y.length;
    if (d && _ === 0)
      return;
    d = _ === 0;
    let S = !1;
    if (st) {
      var k = fw(l) === Np;
      k !== (_ === 0) && (l = Kf(), mn(l), Bi(!1), S = !0);
    }
    if (st) {
      for (var T = null, E, M = 0; M < _; M++) {
        if (Et.nodeType === zs && /** @type {Comment} */
        Et.data === Fp) {
          l = /** @type {Comment} */
          Et, S = !0, Bi(!1);
          break;
        }
        var R = y[M], z = n(R, M);
        E = Pv(
          Et,
          u,
          T,
          null,
          R,
          z,
          M,
          a,
          e,
          r
        ), u.items.set(z, E), T = E;
      }
      _ > 0 && mn(Kf());
    }
    if (st)
      _ === 0 && o && (h = Zr(() => o(l)));
    else if (Ad()) {
      var B = /* @__PURE__ */ new Set(), $ = (
        /** @type {Batch} */
        er
      );
      for (M = 0; M < _; M += 1) {
        R = y[M], z = n(R, M);
        var L = u.items.get(z) ?? g.get(z);
        L ? (e & (Ld | Bd)) !== 0 && Yw(L, R, M, e) : (E = Pv(
          null,
          u,
          null,
          null,
          R,
          z,
          M,
          a,
          e,
          r,
          !0
        ), g.set(z, E)), B.add(z);
      }
      for (const [q, j] of u.items)
        B.has(q) || $.skipped_effects.add(j.e);
      $.add_callback(x);
    } else
      x();
    S && Bi(!0), v(m);
  }), st && (l = Et);
}
function QE(t, e, r, n, a, o, l, u, c) {
  var f = (l & KC) !== 0, h = (l & (Ld | Bd)) !== 0, d = e.length, g = r.items, m = r.first, y = m, w, x = null, _, S = [], k = [], T, E, M, R;
  if (f)
    for (R = 0; R < d; R += 1)
      T = e[R], E = u(T, R), M = g.get(E), M !== void 0 && (M.a?.measure(), (_ ??= /* @__PURE__ */ new Set()).add(M));
  for (R = 0; R < d; R += 1) {
    if (T = e[R], E = u(T, R), M = g.get(E), M === void 0) {
      var z = n.get(E);
      if (z !== void 0) {
        n.delete(E), g.set(E, z);
        var B = x ? x.next : y;
        Ji(r, x, z), Ji(r, z, B), E0(z, B, a), x = z;
      } else {
        var $ = y ? (
          /** @type {TemplateNode} */
          y.e.nodes_start
        ) : a;
        x = Pv(
          $,
          r,
          x,
          x === null ? r.first : x.next,
          T,
          E,
          R,
          o,
          l,
          c
        );
      }
      g.set(E, x), S = [], k = [], y = x.next;
      continue;
    }
    if (h && Yw(M, T, R, l), (M.e.f & Ai) !== 0 && (Bp(M.e), f && (M.a?.unfix(), (_ ??= /* @__PURE__ */ new Set()).delete(M))), M !== y) {
      if (w !== void 0 && w.has(M)) {
        if (S.length < k.length) {
          var L = k[0], q;
          x = L.prev;
          var j = S[0], W = S[S.length - 1];
          for (q = 0; q < S.length; q += 1)
            E0(S[q], L, a);
          for (q = 0; q < k.length; q += 1)
            w.delete(k[q]);
          Ji(r, j.prev, W.next), Ji(r, x, j), Ji(r, W, L), y = L, x = W, R -= 1, S = [], k = [];
        } else
          w.delete(M), E0(M, y, a), Ji(r, M.prev, M.next), Ji(r, M, x === null ? r.first : x.next), Ji(r, x, M), x = M;
        continue;
      }
      for (S = [], k = []; y !== null && y.k !== E; )
        (y.e.f & Ai) === 0 && (w ??= /* @__PURE__ */ new Set()).add(y), k.push(y), y = y.next;
      if (y === null)
        continue;
      M = y;
    }
    S.push(M), x = M, y = M.next;
  }
  if (y !== null || w !== void 0) {
    for (var Y = w === void 0 ? [] : Cp(w); y !== null; )
      (y.e.f & Ai) === 0 && Y.push(y), y = y.next;
    var G = Y.length;
    if (G > 0) {
      var X = (l & ow) !== 0 && d === 0 ? a : null;
      if (f) {
        for (R = 0; R < G; R += 1)
          Y[R].a?.measure();
        for (R = 0; R < G; R += 1)
          Y[R].a?.fix();
      }
      JE(r, Y, X);
    }
  }
  f && Nl(() => {
    if (_ !== void 0)
      for (M of _)
        M.a?.apply();
  }), t.first = r.first && r.first.e, t.last = x && x.e;
  for (var K of n.values())
    ln(K.e);
  n.clear();
}
function Yw(t, e, r, n) {
  (n & Ld) !== 0 && Ls(t.v, e), (n & Bd) !== 0 ? Ls(
    /** @type {Value<number>} */
    t.i,
    r
  ) : t.i = r;
}
function Pv(t, e, r, n, a, o, l, u, c, f, h) {
  var d = qf, g = (c & Ld) !== 0, m = (c & JC) === 0, y = g ? m ? /* @__PURE__ */ Dp(a, !1, !1) : yl(a) : a, w = (c & Bd) === 0 ? l : yl(l), x = {
    i: w,
    v: y,
    k: o,
    a: null,
    // @ts-expect-error
    e: null,
    prev: r,
    next: n
  };
  qf = x;
  try {
    if (t === null) {
      var _ = document.createDocumentFragment();
      _.append(t = ki());
    }
    return x.e = Zr(() => u(
      /** @type {Node} */
      t,
      y,
      w,
      f
    ), st), x.e.prev = r && r.e, x.e.next = n && n.e, r === null ? h || (e.first = x) : (r.next = x, r.e.next = x.e), n !== null && (n.prev = x, n.e.prev = x.e), x;
  } finally {
    qf = d;
  }
}
function E0(t, e, r) {
  for (var n = t.next ? (
    /** @type {TemplateNode} */
    t.next.e.nodes_start
  ) : r, a = e ? (
    /** @type {TemplateNode} */
    e.e.nodes_start
  ) : r, o = (
    /** @type {TemplateNode} */
    t.e.nodes_start
  ); o !== null && o !== n; ) {
    var l = (
      /** @type {TemplateNode} */
      /* @__PURE__ */ Wi(o)
    );
    a.before(o), o = l;
  }
}
function Ji(t, e, r) {
  e === null ? t.first = r : (e.next = r, e.e.next = r && r.e), r !== null && (r.prev = e, r.e.prev = e && e.e);
}
function eM(t, e, r = !1, n = !1, a = !1) {
  var o = t, l = "";
  Ne(() => {
    var u = (
      /** @type {Effect} */
      gt
    );
    if (l === (l = e() ?? "")) {
      st && Ba();
      return;
    }
    if (u.nodes_start !== null && (Aw(
      u.nodes_start,
      /** @type {TemplateNode} */
      u.nodes_end
    ), u.nodes_start = u.nodes_end = null), l !== "") {
      if (st) {
        Et.data;
        for (var c = Ba(), f = c; c !== null && (c.nodeType !== zs || /** @type {Comment} */
        c.data !== ""); )
          f = c, c = /** @type {TemplateNode} */
          /* @__PURE__ */ Wi(c);
        if (c === null)
          throw mc(), nl;
        Kn(Et, f), o = mn(c);
        return;
      }
      var h = l + "";
      r ? h = `<svg>${h}</svg>` : n && (h = `<math>${h}</math>`);
      var d = Ap(h);
      if ((r || n) && (d = /** @type {Element} */
      /* @__PURE__ */ tn(d)), Kn(
        /** @type {TemplateNode} */
        /* @__PURE__ */ tn(d),
        /** @type {TemplateNode} */
        d.lastChild
      ), r || n)
        for (; /* @__PURE__ */ tn(d); )
          o.before(
            /** @type {Node} */
            /* @__PURE__ */ tn(d)
          );
      else
        o.before(d);
    }
  });
}
function qp(t, e, r) {
  st && Ba();
  var n = t, a, o, l = null, u = null;
  function c() {
    o && (bo(o), o = null), l && (l.lastChild.remove(), n.before(l), l = null), o = u, u = null;
  }
  No(() => {
    if (a !== (a = e())) {
      var f = Ad();
      if (a) {
        var h = n;
        f && (l = document.createDocumentFragment(), l.append(h = ki())), u = Zr(() => r(h, a));
      }
      f ? er.add_callback(c) : c();
    }
  }, Tl), st && (n = Et);
}
function Zw(t, e, r) {
  Ws(() => {
    var n = Gi(() => e(t, r?.()) || {});
    if (r && n?.update) {
      var a = !1, o = (
        /** @type {any} */
        {}
      );
      yc(() => {
        var l = r();
        FE(l), a && Rp(o, l) && (o = l, n.update(l));
      }), a = !0;
    }
    if (n?.destroy)
      return () => (
        /** @type {Function} */
        n.destroy()
      );
  });
}
function tM(t, e) {
  var r = void 0, n;
  No(() => {
    r !== (r = e()) && (n && (ln(n), n = null), r && (n = Zr(() => {
      Ws(() => (
        /** @type {(node: Element) => void} */
        r(t)
      ));
    })));
  });
}
function Kw(t) {
  var e, r, n = "";
  if (typeof t == "string" || typeof t == "number") n += t;
  else if (typeof t == "object") if (Array.isArray(t)) {
    var a = t.length;
    for (e = 0; e < a; e++) t[e] && (r = Kw(t[e])) && (n && (n += " "), n += r);
  } else for (r in t) t[r] && (n && (n += " "), n += r);
  return n;
}
function rM() {
  for (var t, e, r = 0, n = "", a = arguments.length; r < a; r++) (t = arguments[r]) && (e = Kw(t)) && (n && (n += " "), n += e);
  return n;
}
function nM(t) {
  return typeof t == "object" ? rM(t) : t ?? "";
}
const By = [...` 	
\r\f \v\uFEFF`];
function iM(t, e, r) {
  var n = t == null ? "" : "" + t;
  if (e && (n = n ? n + " " + e : e), r) {
    for (var a in r)
      if (r[a])
        n = n ? n + " " + a : a;
      else if (n.length)
        for (var o = a.length, l = 0; (l = n.indexOf(a, l)) >= 0; ) {
          var u = l + o;
          (l === 0 || By.includes(n[l - 1])) && (u === n.length || By.includes(n[u])) ? n = (l === 0 ? "" : n.substring(0, l)) + n.substring(u + 1) : l = u;
        }
  }
  return n === "" ? null : n;
}
function Ay(t, e = !1) {
  var r = e ? " !important;" : ";", n = "";
  for (var a in t) {
    var o = t[a];
    o != null && o !== "" && (n += " " + a + ": " + o + r);
  }
  return n;
}
function M0(t) {
  return t[0] !== "-" || t[1] !== "-" ? t.toLowerCase() : t;
}
function aM(t, e) {
  if (e) {
    var r = "", n, a;
    if (Array.isArray(e) ? (n = e[0], a = e[1]) : n = e, t) {
      t = String(t).replaceAll(/\s*\/\*.*?\*\/\s*/g, "").trim();
      var o = !1, l = 0, u = !1, c = [];
      n && c.push(...Object.keys(n).map(M0)), a && c.push(...Object.keys(a).map(M0));
      var f = 0, h = -1;
      const w = t.length;
      for (var d = 0; d < w; d++) {
        var g = t[d];
        if (u ? g === "/" && t[d - 1] === "*" && (u = !1) : o ? o === g && (o = !1) : g === "/" && t[d + 1] === "*" ? u = !0 : g === '"' || g === "'" ? o = g : g === "(" ? l++ : g === ")" && l--, !u && o === !1 && l === 0) {
          if (g === ":" && h === -1)
            h = d;
          else if (g === ";" || d === w - 1) {
            if (h !== -1) {
              var m = M0(t.substring(f, h).trim());
              if (!c.includes(m)) {
                g !== ";" && d++;
                var y = t.substring(f, d).trim();
                r += " " + y + ";";
              }
            }
            f = d + 1, h = -1;
          }
        }
      }
    }
    return n && (r += Ay(n)), a && (r += Ay(a, !0)), r = r.trim(), r === "" ? null : r;
  }
  return t == null ? null : String(t);
}
function Sr(t, e, r, n, a, o) {
  var l = t.__className;
  if (st || l !== r || l === void 0) {
    var u = iM(r, n, o);
    (!st || u !== t.getAttribute("class")) && (u == null ? t.removeAttribute("class") : e ? t.className = u : t.setAttribute("class", u)), t.__className = r;
  } else if (o && a !== o)
    for (var c in o) {
      var f = !!o[c];
      (a == null || f !== !!a[c]) && t.classList.toggle(c, f);
    }
  return o;
}
function R0(t, e = {}, r, n) {
  for (var a in r) {
    var o = r[a];
    e[a] !== o && (r[a] == null ? t.style.removeProperty(a) : t.style.setProperty(a, o, n));
  }
}
function nt(t, e, r, n) {
  var a = t.__style;
  if (st || a !== e) {
    var o = aM(e, n);
    (!st || o !== t.getAttribute("style")) && (o == null ? t.removeAttribute("style") : t.style.cssText = o), t.__style = e;
  } else n && (Array.isArray(n) ? (R0(t, r?.[0], n[0]), R0(t, r?.[1], n[1], "important")) : R0(t, r, n));
  return n;
}
function Bs(t, e, r = !1) {
  if (t.multiple) {
    if (e == null)
      return;
    if (!Od(e))
      return cE();
    for (var n of t.options)
      n.selected = e.includes(qy(n));
    return;
  }
  for (n of t.options) {
    var a = qy(n);
    if (dE(a, e)) {
      n.selected = !0;
      return;
    }
  }
  (!r || e !== void 0) && (t.selectedIndex = -1);
}
function ed(t) {
  var e = new MutationObserver(() => {
    Bs(t, t.__value);
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
  }), Op(() => {
    e.disconnect();
  });
}
function qy(t) {
  return "__value" in t ? t.__value : t.value;
}
const yu = Symbol("class"), bu = Symbol("style"), Jw = Symbol("is custom element"), Qw = Symbol("is html");
function oM(t) {
  if (st) {
    var e = !1, r = () => {
      if (!e) {
        if (e = !0, t.hasAttribute("value")) {
          var n = t.value;
          Q(t, "value", null), t.value = n;
        }
        if (t.hasAttribute("checked")) {
          var a = t.checked;
          Q(t, "checked", null), t.checked = a;
        }
      }
    };
    t.__on_r = r, pE(r), Uw();
  }
}
function lM(t, e) {
  e ? t.hasAttribute("selected") || t.setAttribute("selected", "") : t.removeAttribute("selected");
}
function Q(t, e, r, n) {
  var a = e2(t);
  st && (a[e] = t.getAttribute(e), e === "src" || e === "srcset" || e === "href" && t.nodeName === "LINK") || a[e] !== (a[e] = r) && (e === "loading" && (t[PC] = r), r == null ? t.removeAttribute(e) : typeof r != "string" && t2(t).includes(e) ? t[e] = r : t.setAttribute(e, r));
}
function sM(t, e, r, n, a = !1) {
  var o = e2(t), l = o[Jw], u = !o[Qw];
  let c = st && l;
  c && Bi(!1);
  var f = e || {}, h = t.tagName === "OPTION";
  for (var d in e)
    d in r || (r[d] = null);
  r.class ? r.class = nM(r.class) : r[yu] && (r.class = null), r[bu] && (r.style ??= null);
  var g = t2(t);
  for (const k in r) {
    let T = r[k];
    if (h && k === "value" && T == null) {
      t.value = t.__value = "", f[k] = T;
      continue;
    }
    if (k === "class") {
      var m = t.namespaceURI === "http://www.w3.org/1999/xhtml";
      Sr(t, m, T, n, e?.[yu], r[yu]), f[k] = T, f[yu] = r[yu];
      continue;
    }
    if (k === "style") {
      nt(t, T, e?.[bu], r[bu]), f[k] = T, f[bu] = r[bu];
      continue;
    }
    var y = f[k];
    if (!(T === y && !(T === void 0 && t.hasAttribute(k)))) {
      f[k] = T;
      var w = k[0] + k[1];
      if (w !== "$$")
        if (w === "on") {
          const E = {}, M = "$$" + k;
          let R = k.slice(2);
          var x = IE(R);
          if ($E(R) && (R = R.slice(0, -7), E.capture = !0), !x && y) {
            if (T != null) continue;
            t.removeEventListener(R, f[M], E), f[M] = null;
          }
          if (T != null)
            if (x)
              t[`__${R}`] = T, Nr([R]);
            else {
              let z = function(B) {
                f[k].call(this, B);
              };
              f[M] = Hw(R, t, z, E);
            }
          else x && (t[`__${R}`] = void 0);
        } else if (k === "style")
          Q(t, k, T);
        else if (k === "autofocus")
          BE(
            /** @type {HTMLElement} */
            t,
            !!T
          );
        else if (!l && (k === "__value" || k === "value" && T != null))
          t.value = t.__value = T;
        else if (k === "selected" && h)
          lM(
            /** @type {HTMLOptionElement} */
            t,
            T
          );
        else {
          var _ = k;
          u || (_ = WE(_));
          var S = _ === "defaultValue" || _ === "defaultChecked";
          if (T == null && !l && !S)
            if (o[k] = null, _ === "value" || _ === "checked") {
              let E = (
                /** @type {HTMLInputElement} */
                t
              );
              const M = e === void 0;
              if (_ === "value") {
                let R = E.defaultValue;
                E.removeAttribute(_), E.defaultValue = R, E.value = E.__value = M ? R : null;
              } else {
                let R = E.defaultChecked;
                E.removeAttribute(_), E.defaultChecked = R, E.checked = M ? R : !1;
              }
            } else
              t.removeAttribute(k);
          else S || g.includes(_) && (l || typeof T != "string") ? (t[_] = T, _ in o && (o[_] = jr)) : typeof T != "function" && Q(t, _, T);
        }
    }
  }
  return c && Bi(!0), f;
}
function ri(t, e, r = [], n = [], a, o = !1) {
  kw(r, n, (l) => {
    var u = void 0, c = {}, f = t.nodeName === "SELECT", h = !1;
    if (No(() => {
      var g = e(...l.map(v)), m = sM(t, u, g, a, o);
      h && f && "value" in g && Bs(
        /** @type {HTMLSelectElement} */
        t,
        g.value
      );
      for (let w of Object.getOwnPropertySymbols(c))
        g[w] || ln(c[w]);
      for (let w of Object.getOwnPropertySymbols(g)) {
        var y = g[w];
        w.description === sE && (!u || y !== u[w]) && (c[w] && ln(c[w]), c[w] = Zr(() => tM(t, () => y))), m[w] = y;
      }
      u = m;
    }), f) {
      var d = (
        /** @type {HTMLSelectElement} */
        t
      );
      Ws(() => {
        Bs(
          d,
          /** @type {Record<string | symbol, any>} */
          u.value,
          !0
        ), ed(d);
      });
    }
    h = !0;
  });
}
function e2(t) {
  return (
    /** @type {Record<string | symbol, unknown>} **/
    // @ts-expect-error
    t.__attributes ??= {
      [Jw]: t.nodeName.includes("-"),
      [Qw]: t.namespaceURI === lE
    }
  );
}
var jy = /* @__PURE__ */ new Map();
function t2(t) {
  var e = jy.get(t.nodeName);
  if (e) return e;
  jy.set(t.nodeName, e = []);
  for (var r, n = t, a = Element.prototype; a !== n; ) {
    r = nw(n);
    for (var o in r)
      r[o].set && e.push(o);
    n = Ep(n);
  }
  return e;
}
const uM = () => performance.now(), ta = {
  // don't access requestAnimationFrame eagerly outside method
  // this allows basic testing of user code without JSDOM
  // bunder will eval and remove ternary when the user's app is built
  tick: (
    /** @param {any} _ */
    (t) => requestAnimationFrame(t)
  ),
  now: () => uM(),
  tasks: /* @__PURE__ */ new Set()
};
function r2() {
  const t = ta.now();
  ta.tasks.forEach((e) => {
    e.c(t) || (ta.tasks.delete(e), e.f());
  }), ta.tasks.size !== 0 && ta.tick(r2);
}
function n2(t) {
  let e;
  return ta.tasks.size === 0 && ta.tick(r2), {
    promise: new Promise((r) => {
      ta.tasks.add(e = { c: t, f: r });
    }),
    abort() {
      ta.tasks.delete(e);
    }
  };
}
function bf(t, e) {
  Ud(() => {
    t.dispatchEvent(new CustomEvent(e));
  });
}
function cM(t) {
  if (t === "float") return "cssFloat";
  if (t === "offset") return "cssOffset";
  if (t.startsWith("--")) return t;
  const e = t.split("-");
  return e.length === 1 ? e[0] : e[0] + e.slice(1).map(
    /** @param {any} word */
    (r) => r[0].toUpperCase() + r.slice(1)
  ).join("");
}
function $y(t) {
  const e = {}, r = t.split(";");
  for (const n of r) {
    const [a, o] = n.split(":");
    if (!a || o === void 0) break;
    const l = cM(a.trim());
    e[l] = o.trim();
  }
  return e;
}
const fM = (t) => t;
function dM(t, e, r) {
  var n = (
    /** @type {EachItem} */
    qf
  ), a, o, l, u = null;
  n.a ??= {
    element: t,
    measure() {
      a = this.element.getBoundingClientRect();
    },
    apply() {
      if (l?.abort(), o = this.element.getBoundingClientRect(), a.left !== o.left || a.right !== o.right || a.top !== o.top || a.bottom !== o.bottom) {
        const c = e()(this.element, { from: a, to: o }, r?.());
        l = rd(this.element, c, void 0, 1, () => {
          l?.abort(), l = void 0;
        });
      }
    },
    fix() {
      if (!t.getAnimations().length) {
        var { position: c, width: f, height: h } = getComputedStyle(t);
        if (c !== "absolute" && c !== "fixed") {
          var d = (
            /** @type {HTMLElement | SVGElement} */
            t.style
          );
          u = {
            position: d.position,
            width: d.width,
            height: d.height,
            transform: d.transform
          }, d.position = "absolute", d.width = f, d.height = h;
          var g = t.getBoundingClientRect();
          if (a.left !== g.left || a.top !== g.top) {
            var m = `translate(${a.left - g.left}px, ${a.top - g.top}px)`;
            d.transform = d.transform ? `${d.transform} ${m}` : m;
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
function td(t, e, r, n) {
  var a = (t & nE) !== 0, o = (t & iE) !== 0, l = a && o, u = (t & aE) !== 0, c = l ? "both" : a ? "in" : "out", f, h = e.inert, d = e.style.overflow, g, m;
  function y() {
    return Ud(() => f ??= r()(e, n?.() ?? /** @type {P} */
    {}, {
      direction: c
    }));
  }
  var w = {
    is_global: u,
    in() {
      if (e.inert = h, !a) {
        m?.abort(), m?.reset?.();
        return;
      }
      o || g?.abort(), bf(e, "introstart"), g = rd(e, y(), m, 1, () => {
        bf(e, "introend"), g?.abort(), g = f = void 0, e.style.overflow = d;
      });
    },
    out(k) {
      if (!o) {
        k?.(), f = void 0;
        return;
      }
      e.inert = !0, bf(e, "outrostart"), m = rd(e, y(), g, 0, () => {
        bf(e, "outroend"), k?.();
      });
    },
    stop: () => {
      g?.abort(), m?.abort();
    }
  }, x = (
    /** @type {Effect} */
    gt
  );
  if ((x.transitions ??= []).push(w), a && Nv) {
    var _ = u;
    if (!_) {
      for (var S = (
        /** @type {Effect | null} */
        x.parent
      ); S && (S.f & Tl) !== 0; )
        for (; (S = S.parent) && (S.f & Hs) === 0; )
          ;
      _ = !S || (S.f & zd) !== 0;
    }
    _ && Ws(() => {
      Gi(() => w.in());
    });
  }
}
function rd(t, e, r, n, a) {
  var o = n === 1;
  if (ps(e)) {
    var l, u = !1;
    return Nl(() => {
      if (!u) {
        var x = e({ direction: o ? "in" : "out" });
        l = rd(t, x, r, n, a);
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
    return a(), {
      abort: Ot,
      deactivate: Ot,
      reset: Ot,
      t: () => n
    };
  const { delay: c = 0, css: f, tick: h, easing: d = fM } = e;
  var g = [];
  if (o && r === void 0 && (h && h(0, 1), f)) {
    var m = $y(f(0, 1));
    g.push(m, m);
  }
  var y = () => 1 - n, w = t.animate(g, { duration: c, fill: "forwards" });
  return w.onfinish = () => {
    w.cancel();
    var x = r?.t() ?? 1 - n;
    r?.abort();
    var _ = n - x, S = (
      /** @type {number} */
      e.duration * Math.abs(_)
    ), k = [];
    if (S > 0) {
      var T = !1;
      if (f)
        for (var E = Math.ceil(S / 16.666666666666668), M = 0; M <= E; M += 1) {
          var R = x + _ * d(M / E), z = $y(f(R, 1 - R));
          k.push(z), T ||= z.overflow === "hidden";
        }
      T && (t.style.overflow = "hidden"), y = () => {
        var B = (
          /** @type {number} */
          /** @type {globalThis.Animation} */
          w.currentTime
        );
        return x + _ * d(B / S);
      }, h && n2(() => {
        if (w.playState !== "running") return !1;
        var B = y();
        return h(B, 1 - B), !0;
      });
    }
    w = t.animate(k, { duration: S, fill: "forwards" }), w.onfinish = () => {
      y = () => n, h?.(n, 1 - n), a();
    };
  }, {
    abort: () => {
      w && (w.cancel(), w.effect = null, w.onfinish = Ot);
    },
    deactivate: () => {
      a = Ot;
    },
    reset: () => {
      n === 0 && h?.(1, 0);
    },
    t: () => y()
  };
}
function hM(t, e, r = e) {
  var n = /* @__PURE__ */ new WeakSet();
  AE(t, "input", (a) => {
    var o = a ? t.defaultValue : t.value;
    if (o = T0(t) ? N0(o) : o, r(o), er !== null && n.add(er), o !== (o = e())) {
      var l = t.selectionStart, u = t.selectionEnd;
      t.value = o ?? "", u !== null && (t.selectionStart = l, t.selectionEnd = Math.min(u, t.value.length));
    }
  }), // If we are hydrating and the value has since changed,
  // then use the updated value from the input instead.
  (st && t.defaultValue !== t.value || // If defaultValue is set, then value == defaultValue
  // TODO Svelte 6: remove input.value check and set to empty string?
  Gi(e) == null && t.value) && (r(T0(t) ? N0(t.value) : t.value), er !== null && n.add(er)), yc(() => {
    var a = e();
    if (t === document.activeElement) {
      var o = (
        /** @type {Batch} */
        Bf ?? er
      );
      if (n.has(o))
        return;
    }
    T0(t) && a === N0(t.value) || t.type === "date" && !a && !t.value || a !== t.value && (t.value = a ?? "");
  });
}
function T0(t) {
  var e = t.type;
  return e === "number" || e === "range";
}
function N0(t) {
  return t === "" ? null : +t;
}
class jp {
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
      var a = this.#e.get(e);
      a.delete(r), a.size === 0 && (this.#e.delete(e), this.#t.unobserve(e));
    };
  }
  #n() {
    return this.#t ?? (this.#t = new ResizeObserver(
      /** @param {any} entries */
      (e) => {
        for (var r of e) {
          jp.entries.set(r.target, r);
          for (var n of this.#e.get(r.target) || [])
            n(r);
        }
      }
    ));
  }
}
var vM = /* @__PURE__ */ new jp({
  box: "border-box"
});
function bl(t, e, r) {
  var n = vM.observe(t, () => r(t[e]));
  Ws(() => (Gi(() => r(t[e])), n));
}
function Uy(t, e) {
  return t === e || t?.[ia] === e;
}
function Ii(t = {}, e, r, n) {
  return Ws(() => {
    var a, o;
    return yc(() => {
      a = o, o = [], Gi(() => {
        t !== r(...o) && (e(t, ...o), a && Uy(r(...a), t) && e(null, ...a));
      });
    }), () => {
      Nl(() => {
        o && Uy(r(...o), t) && e(null, ...o);
      });
    };
  }), t;
}
function $p(t, e, r) {
  if (t == null)
    return e(void 0), r && r(void 0), Ot;
  const n = Gi(
    () => t.subscribe(
      e,
      // @ts-expect-error
      r
    )
  );
  return n.unsubscribe ? () => n.unsubscribe() : n;
}
const fs = [];
function pM(t, e) {
  return {
    subscribe: Xu(t, e).subscribe
  };
}
function Xu(t, e = Ot) {
  let r = null;
  const n = /* @__PURE__ */ new Set();
  function a(u) {
    if (Rp(t, u) && (t = u, r)) {
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
  function o(u) {
    a(u(
      /** @type {T} */
      t
    ));
  }
  function l(u, c = Ot) {
    const f = [u, c];
    return n.add(f), n.size === 1 && (r = e(a, o) || Ot), u(
      /** @type {T} */
      t
    ), () => {
      n.delete(f), n.size === 0 && r && (r(), r = null);
    };
  }
  return { set: a, update: o, subscribe: l };
}
function gM(t, e, r) {
  const n = !Array.isArray(t), a = n ? [t] : t;
  if (!a.every(Boolean))
    throw new Error("derived() expects stores as input, got a falsy value");
  const o = e.length < 2;
  return pM(r, (l, u) => {
    let c = !1;
    const f = [];
    let h = 0, d = Ot;
    const g = () => {
      if (h)
        return;
      d();
      const y = e(n ? f[0] : f, l, u);
      o ? l(y) : d = typeof y == "function" ? y : Ot;
    }, m = a.map(
      (y, w) => $p(
        y,
        (x) => {
          f[w] = x, h &= ~(1 << w), c && g();
        },
        () => {
          h |= 1 << w;
        }
      )
    );
    return c = !0, g(), function() {
      Mp(m), d(), c = !1;
    };
  });
}
function mM(t) {
  let e;
  return $p(t, (r) => e = r)(), e;
}
let xf = !1, zv = Symbol();
function On(t, e, r) {
  const n = r[e] ??= {
    store: null,
    source: /* @__PURE__ */ Dp(void 0),
    unsubscribe: Ot
  };
  if (n.store !== t && !(zv in r))
    if (n.unsubscribe(), n.store = t ?? null, t == null)
      n.source.v = void 0, n.unsubscribe = Ot;
    else {
      var a = !0;
      n.unsubscribe = $p(t, (o) => {
        a ? n.source.v = o : H(n.source, o);
      }), a = !1;
    }
  return t && zv in r ? mM(t) : v(n.source);
}
function xu(t, e) {
  return t.set(e), e;
}
function Ei() {
  const t = {};
  function e() {
    Op(() => {
      for (var r in t)
        t[r].unsubscribe();
      Uu(t, zv, {
        enumerable: !1,
        value: !0
      });
    });
  }
  return [t, e];
}
function yM(t) {
  var e = xf;
  try {
    return xf = !1, [t(), xf];
  } finally {
    xf = e;
  }
}
const bM = {
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
    bM
  );
}
const xM = {
  get(t, e) {
    let r = t.props.length;
    for (; r--; ) {
      let n = t.props[r];
      if (ps(n) && (n = n()), typeof n == "object" && n !== null && e in n) return n[e];
    }
  },
  set(t, e, r) {
    let n = t.props.length;
    for (; n--; ) {
      let a = t.props[n];
      ps(a) && (a = a());
      const o = yo(a, e);
      if (o && o.set)
        return o.set(r), !0;
    }
    return !1;
  },
  getOwnPropertyDescriptor(t, e) {
    let r = t.props.length;
    for (; r--; ) {
      let n = t.props[r];
      if (ps(n) && (n = n()), typeof n == "object" && n !== null && e in n) {
        const a = yo(n, e);
        return a && !a.configurable && (a.configurable = !0), a;
      }
    }
  },
  has(t, e) {
    if (e === ia || e === _p) return !1;
    for (let r of t.props)
      if (ps(r) && (r = r()), r != null && e in r) return !0;
    return !1;
  },
  ownKeys(t) {
    const e = [];
    for (let r of t.props)
      if (ps(r) && (r = r()), !!r) {
        for (const n in r)
          e.includes(n) || e.push(n);
        for (const n of Object.getOwnPropertySymbols(r))
          e.includes(n) || e.push(n);
      }
    return e;
  }
};
function wM(...t) {
  return new Proxy({ props: t }, xM);
}
function tt(t, e, r, n) {
  var a = (r & tE) !== 0, o = (r & rE) !== 0, l = (
    /** @type {V} */
    n
  ), u = !0, c = () => (u && (u = !1, l = o ? Gi(
    /** @type {() => V} */
    n
  ) : (
    /** @type {V} */
    n
  )), l), f;
  if (a) {
    var h = ia in t || _p in t;
    f = yo(t, e)?.set ?? (h && e in t ? (S) => t[e] = S : void 0);
  }
  var d, g = !1;
  a ? [d, g] = yM(() => (
    /** @type {V} */
    t[e]
  )) : d = /** @type {V} */
  t[e], d === void 0 && n !== void 0 && (d = c(), f && (WC(), f(d)));
  var m;
  if (m = () => {
    var S = (
      /** @type {V} */
      t[e]
    );
    return S === void 0 ? c() : (u = !0, S);
  }, (r & eE) === 0)
    return m;
  if (f) {
    var y = t.$$legacy;
    return function(S, k) {
      return arguments.length > 0 ? ((!k || y || g) && f(k ? m() : S), S) : m();
    };
  }
  var w = !1, x = ((r & QC) !== 0 ? qd : xw)(() => (w = !1, m()));
  a && v(x);
  var _ = (
    /** @type {Effect} */
    gt
  );
  return function(S, k) {
    if (arguments.length > 0) {
      const T = k ? v(x) : a ? gi(S) : S;
      return H(x, T), w = !0, l !== void 0 && (l = T), S;
    }
    return Fl && w || (_.f & Rl) !== 0 ? x.v : v(x);
  };
}
function _M(t) {
  return t;
}
function Up(t) {
  const e = t - 1;
  return e * e * e + 1;
}
function Iy(t) {
  return Object.prototype.toString.call(t) === "[object Date]";
}
function Dv(t, e) {
  if (t === e || t !== t) return () => t;
  const r = typeof t;
  if (r !== typeof e || Array.isArray(t) !== Array.isArray(e))
    throw new Error("Cannot interpolate values of different type");
  if (Array.isArray(t)) {
    const n = (
      /** @type {Array<any>} */
      e.map((a, o) => Dv(
        /** @type {Array<any>} */
        t[o],
        a
      ))
    );
    return (a) => n.map((o) => o(a));
  }
  if (r === "object") {
    if (!t || !e)
      throw new Error("Object cannot be null");
    if (Iy(t) && Iy(e)) {
      const o = t.getTime(), u = e.getTime() - o;
      return (c) => new Date(o + c * u);
    }
    const n = Object.keys(e), a = {};
    return n.forEach((o) => {
      a[o] = Dv(t[o], e[o]);
    }), (o) => {
      const l = {};
      return n.forEach((u) => {
        l[u] = a[u](o);
      }), l;
    };
  }
  if (r === "number") {
    const n = (
      /** @type {number} */
      e - /** @type {number} */
      t
    );
    return (a) => t + a * n;
  }
  return () => e;
}
class Ip {
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
    this.#e = /* @__PURE__ */ me(e), this.#t = /* @__PURE__ */ me(e), this.#r = r;
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
    const n = new Ip(e(), r);
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
    H(this.#t, e);
    let {
      delay: n = 0,
      duration: a = 400,
      easing: o = _M,
      interpolate: l = Dv
    } = { ...this.#r, ...r };
    if (a === 0)
      return this.#n?.abort(), H(this.#e, e), Promise.resolve();
    const u = ta.now() + n;
    let c, f = !1, h = this.#n;
    return this.#n = n2((d) => {
      if (d < u)
        return !0;
      if (!f) {
        f = !0;
        const m = this.#e.v;
        c = l(m, e), typeof a == "function" && (a = a(m, e)), h?.abort();
      }
      const g = d - u;
      return g > /** @type {number} */
      a ? (H(this.#e, e), !1) : (H(this.#e, c(o(g / /** @type {number} */
      a))), !0);
    }), this.#n.promise;
  }
  get current() {
    return v(this.#e);
  }
  get target() {
    return v(this.#t);
  }
  set target(e) {
    this.set(e);
  }
}
function kM(t) {
  const e = t - 1;
  return e * e * e + 1;
}
function nd(t, { delay: e = 0, duration: r = 400, easing: n = kM, axis: a = "y" } = {}) {
  const o = getComputedStyle(t), l = +o.opacity, u = a === "y" ? "height" : "width", c = parseFloat(o[u]), f = a === "y" ? ["top", "bottom"] : ["left", "right"], h = f.map(
    (_) => (
      /** @type {'Left' | 'Right' | 'Top' | 'Bottom'} */
      `${_[0].toUpperCase()}${_.slice(1)}`
    )
  ), d = parseFloat(o[`padding${h[0]}`]), g = parseFloat(o[`padding${h[1]}`]), m = parseFloat(o[`margin${h[0]}`]), y = parseFloat(o[`margin${h[1]}`]), w = parseFloat(
    o[`border${h[0]}Width`]
  ), x = parseFloat(
    o[`border${h[1]}Width`]
  );
  return {
    delay: e,
    duration: r,
    easing: n,
    css: (_) => `overflow: hidden;opacity: ${Math.min(_ * 20, 1) * l};${u}: ${_ * c}px;padding-${f[0]}: ${_ * d}px;padding-${f[1]}: ${_ * g}px;margin-${f[0]}: ${_ * m}px;margin-${f[1]}: ${_ * y}px;border-${f[0]}-width: ${_ * w}px;border-${f[1]}-width: ${_ * x}px;min-${u}: 0`
  };
}
function i2() {
  return !(navigator.gpu == null || navigator.gpu.requestAdapter == null);
}
function SM(t) {
  return t == 0 && (t = 4), t % 4 != 0 && (t += 4 - t % 4), t;
}
function ws(t, e, r, n) {
  return (t.buffer == null || t.byteSize != r || t.usage != n) && (t.buffer != null && t.buffer.destroy(), t.buffer = e.createBuffer({ size: SM(r), usage: n }), t.byteSize = r, t.destroy = () => {
    t.buffer?.destroy();
  }), t.buffer;
}
function F0(t, e, r, n) {
  if (t.buffer !== r || t.data !== n) {
    if (n != null)
      if (n.byteLength % 4 != 0) {
        let a = n.byteLength - n.byteLength % 4;
        if (e.queue.writeBuffer(r, 0, n, 0, a), n instanceof Uint8Array) {
          let o = new Uint8Array(4);
          for (let l = 0; l < 4; l++)
            a + l < n.length && (o[l] = n[a + l]);
          e.queue.writeBuffer(r, a, o);
        }
      } else
        e.queue.writeBuffer(r, 0, n, 0);
    else
      e.queue.writeBuffer(r, 0, new ArrayBuffer(r.size));
    t.buffer = r, t.data = n;
  }
  return r;
}
function Hy(t, e, r, n, a, o) {
  return (t.texture == null || t.width != r || t.height != n || t.format != a || t.usage != o) && (t.texture != null && t.texture.destroy(), t.texture = e.createTexture({ size: [r, n], format: a, usage: o }), t.destroy = () => {
    t.texture?.destroy();
  }), t.texture;
}
const Qn = 2, Hp = 4, Hd = 8, xc = 16, Ua = 32, Pl = 64, a2 = 128, xi = 256, id = 512, rn = 1024, Si = 2048, Fo = 4096, qi = 8192, zl = 16384, Wp = 32768, Gp = 65536, Wy = 1 << 17, CM = 1 << 18, Vp = 1 << 19, Xp = 1 << 20, Ov = 1 << 21, Yp = 1 << 22, ol = 1 << 23, ll = Symbol("$state"), o2 = Symbol("legacy props"), EM = Symbol(""), Zp = new class extends Error {
  name = "StaleReactionError";
  message = "The reaction that called `getAbortSignal()` was re-run or destroyed";
}(), l2 = 3, Yu = 8, MM = !1;
var Kp = Array.isArray, RM = Array.prototype.indexOf, Jp = Array.from, ad = Object.defineProperty, _s = Object.getOwnPropertyDescriptor, s2 = Object.getOwnPropertyDescriptors, TM = Object.prototype, NM = Array.prototype, Qp = Object.getPrototypeOf, Gy = Object.isExtensible;
function u2(t) {
  for (var e = 0; e < t.length; e++)
    t[e]();
}
function FM() {
  var t, e, r = new Promise((n, a) => {
    t = n, e = a;
  });
  return { promise: r, resolve: t, reject: e };
}
function c2(t) {
  return t === this.v;
}
function f2(t, e) {
  return t != t ? e == e : t !== e || t !== null && typeof t == "object" || typeof t == "function";
}
function PM(t, e) {
  return t !== e;
}
function d2(t) {
  return !f2(t, this.v);
}
function zM() {
  throw new Error("https://svelte.dev/e/await_outside_boundary");
}
function h2(t) {
  throw new Error("https://svelte.dev/e/lifecycle_outside_component");
}
function DM() {
  throw new Error("https://svelte.dev/e/async_derived_orphan");
}
function OM(t) {
  throw new Error("https://svelte.dev/e/effect_in_teardown");
}
function LM() {
  throw new Error("https://svelte.dev/e/effect_in_unowned_derived");
}
function BM(t) {
  throw new Error("https://svelte.dev/e/effect_orphan");
}
function AM() {
  throw new Error("https://svelte.dev/e/effect_update_depth_exceeded");
}
function qM() {
  throw new Error("https://svelte.dev/e/hydration_failed");
}
function jM(t) {
  throw new Error("https://svelte.dev/e/props_invalid_value");
}
function $M() {
  throw new Error("https://svelte.dev/e/state_descriptors_fixed");
}
function UM() {
  throw new Error("https://svelte.dev/e/state_prototype_fixed");
}
function IM() {
  throw new Error("https://svelte.dev/e/state_unsafe_mutation");
}
let HM = !1;
const eg = 1, tg = 2, v2 = 4, WM = 8, GM = 16, VM = 1, XM = 4, YM = 8, ZM = 16, KM = 1, JM = 2, p2 = "[", rg = "[!", ng = "]", ks = {}, Hr = Symbol(), QM = "http://www.w3.org/1999/xhtml";
let ei = null;
function od(t) {
  ei = t;
}
function Dl(t, e = !1, r) {
  ei = {
    p: ei,
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
    ei
  ), r = e.e;
  if (r !== null) {
    e.e = null;
    for (var n of r)
      j2(n);
  }
  return t !== void 0 && (e.x = t), ei = e.p, t ?? /** @type {T} */
  {};
}
function g2() {
  return !0;
}
function Wd(t) {
  console.warn("https://svelte.dev/e/hydration_mismatch");
}
let tr = !1;
function Ta(t) {
  tr = t;
}
let Zt;
function ji(t) {
  if (t === null)
    throw Wd(), ks;
  return Zt = t;
}
function wc() {
  return ji(
    /** @type {TemplateNode} */
    /* @__PURE__ */ Ia(Zt)
  );
}
function Lr(t) {
  if (tr) {
    if (/* @__PURE__ */ Ia(Zt) !== null)
      throw Wd(), ks;
    Zt = t;
  }
}
function eR(t = 1) {
  if (tr) {
    for (var e = t, r = Zt; e--; )
      r = /** @type {TemplateNode} */
      /* @__PURE__ */ Ia(r);
    Zt = r;
  }
}
function Lv() {
  for (var t = 0, e = Zt; ; ) {
    if (e.nodeType === Yu) {
      var r = (
        /** @type {Comment} */
        e.data
      );
      if (r === ng) {
        if (t === 0) return e;
        t -= 1;
      } else (r === p2 || r === rg) && (t += 1);
    }
    var n = (
      /** @type {TemplateNode} */
      /* @__PURE__ */ Ia(e)
    );
    e.remove(), e = n;
  }
}
function m2(t) {
  if (!t || t.nodeType !== Yu)
    throw Wd(), ks;
  return (
    /** @type {Comment} */
    t.data
  );
}
function Qo(t) {
  if (typeof t != "object" || t === null || ll in t)
    return t;
  const e = Qp(t);
  if (e !== TM && e !== NM)
    return t;
  var r = /* @__PURE__ */ new Map(), n = Kp(t), a = /* @__PURE__ */ vr(0), o = ul, l = (u) => {
    if (ul === o)
      return u();
    var c = jt, f = ul;
    ca(null), Jy(o);
    var h = u();
    return ca(c), Jy(f), h;
  };
  return n && r.set("length", /* @__PURE__ */ vr(
    /** @type {any[]} */
    t.length
  )), new Proxy(
    /** @type {any} */
    t,
    {
      defineProperty(u, c, f) {
        (!("value" in f) || f.configurable === !1 || f.enumerable === !1 || f.writable === !1) && $M();
        var h = r.get(c);
        return h === void 0 ? h = l(() => {
          var d = /* @__PURE__ */ vr(f.value);
          return r.set(c, d), d;
        }) : at(h, f.value, !0), !0;
      },
      deleteProperty(u, c) {
        var f = r.get(c);
        if (f === void 0) {
          if (c in u) {
            const h = l(() => /* @__PURE__ */ vr(Hr));
            r.set(c, h), P0(a);
          }
        } else
          at(f, Hr), P0(a);
        return !0;
      },
      get(u, c, f) {
        if (c === ll)
          return t;
        var h = r.get(c), d = c in u;
        if (h === void 0 && (!d || _s(u, c)?.writable) && (h = l(() => {
          var m = Qo(d ? u[c] : Hr), y = /* @__PURE__ */ vr(m);
          return y;
        }), r.set(c, h)), h !== void 0) {
          var g = O(h);
          return g === Hr ? void 0 : g;
        }
        return Reflect.get(u, c, f);
      },
      getOwnPropertyDescriptor(u, c) {
        var f = Reflect.getOwnPropertyDescriptor(u, c);
        if (f && "value" in f) {
          var h = r.get(c);
          h && (f.value = O(h));
        } else if (f === void 0) {
          var d = r.get(c), g = d?.v;
          if (d !== void 0 && g !== Hr)
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
        var f = r.get(c), h = f !== void 0 && f.v !== Hr || Reflect.has(u, c);
        if (f !== void 0 || Lt !== null && (!h || _s(u, c)?.writable)) {
          f === void 0 && (f = l(() => {
            var g = h ? Qo(u[c]) : Hr, m = /* @__PURE__ */ vr(g);
            return m;
          }), r.set(c, f));
          var d = O(f);
          if (d === Hr)
            return !1;
        }
        return h;
      },
      set(u, c, f, h) {
        var d = r.get(c), g = c in u;
        if (n && c === "length")
          for (var m = f; m < /** @type {Source<number>} */
          d.v; m += 1) {
            var y = r.get(m + "");
            y !== void 0 ? at(y, Hr) : m in u && (y = l(() => /* @__PURE__ */ vr(Hr)), r.set(m + "", y));
          }
        if (d === void 0)
          (!g || _s(u, c)?.writable) && (d = l(() => /* @__PURE__ */ vr(void 0)), at(d, Qo(f)), r.set(c, d));
        else {
          g = d.v !== Hr;
          var w = l(() => Qo(f));
          at(d, w);
        }
        var x = Reflect.getOwnPropertyDescriptor(u, c);
        if (x?.set && x.set.call(h, f), !g) {
          if (n && typeof c == "string") {
            var _ = (
              /** @type {Source<number>} */
              r.get("length")
            ), S = Number(c);
            Number.isInteger(S) && S >= _.v && at(_, S + 1);
          }
          P0(a);
        }
        return !0;
      },
      ownKeys(u) {
        O(a);
        var c = Reflect.ownKeys(u).filter((d) => {
          var g = r.get(d);
          return g === void 0 || g.v !== Hr;
        });
        for (var [f, h] of r)
          h.v !== Hr && !(f in u) && c.push(f);
        return c;
      },
      setPrototypeOf() {
        UM();
      }
    }
  );
}
var Vy, y2, b2, x2;
function Bv() {
  if (Vy === void 0) {
    Vy = window, y2 = /Firefox/.test(navigator.userAgent);
    var t = Element.prototype, e = Node.prototype, r = Text.prototype;
    b2 = _s(e, "firstChild").get, x2 = _s(e, "nextSibling").get, Gy(t) && (t.__click = void 0, t.__className = void 0, t.__attributes = null, t.__style = void 0, t.__e = void 0), Gy(r) && (r.__t = void 0);
  }
}
function _o(t = "") {
  return document.createTextNode(t);
}
// @__NO_SIDE_EFFECTS__
function Aa(t) {
  return b2.call(t);
}
// @__NO_SIDE_EFFECTS__
function Ia(t) {
  return x2.call(t);
}
function Gr(t, e) {
  if (!tr)
    return /* @__PURE__ */ Aa(t);
  var r = (
    /** @type {TemplateNode} */
    /* @__PURE__ */ Aa(Zt)
  );
  if (r === null)
    r = Zt.appendChild(_o());
  else if (e && r.nodeType !== l2) {
    var n = _o();
    return r?.before(n), ji(n), n;
  }
  return ji(r), r;
}
function gs(t, e) {
  if (!tr) {
    var r = (
      /** @type {DocumentFragment} */
      /* @__PURE__ */ Aa(
        /** @type {Node} */
        t
      )
    );
    return r instanceof Comment && r.data === "" ? /* @__PURE__ */ Ia(r) : r;
  }
  return Zt;
}
function mr(t, e = 1, r = !1) {
  let n = tr ? Zt : t;
  for (var a; e--; )
    a = n, n = /** @type {TemplateNode} */
    /* @__PURE__ */ Ia(n);
  if (!tr)
    return n;
  if (r && n?.nodeType !== l2) {
    var o = _o();
    return n === null ? a?.after(o) : n.before(o), ji(o), o;
  }
  return ji(n), /** @type {TemplateNode} */
  n;
}
function w2(t) {
  t.textContent = "";
}
function _2() {
  return !1;
}
const tR = /* @__PURE__ */ new WeakMap();
function rR(t) {
  var e = Lt;
  if (e === null)
    return jt.f |= ol, t;
  if ((e.f & Wp) === 0) {
    if ((e.f & a2) === 0)
      throw !e.parent && t instanceof Error && k2(t), t;
    e.b.error(t);
  } else
    ig(t, e);
}
function ig(t, e) {
  for (; e !== null; ) {
    if ((e.f & a2) !== 0)
      try {
        e.b.error(t);
        return;
      } catch (r) {
        t = r;
      }
    e = e.parent;
  }
  throw t instanceof Error && k2(t), t;
}
function k2(t) {
  const e = tR.get(t);
  e && (ad(t, "message", {
    value: e.message
  }), ad(t, "stack", {
    value: e.stack
  }));
}
let Zu = [], Av = [];
function S2() {
  var t = Zu;
  Zu = [], u2(t);
}
function nR() {
  var t = Av;
  Av = [], u2(t);
}
function ag(t) {
  Zu.length === 0 && queueMicrotask(S2), Zu.push(t);
}
function iR() {
  Zu.length > 0 && S2(), Av.length > 0 && nR();
}
function aR() {
  for (var t = (
    /** @type {Effect} */
    Lt.b
  ); t !== null && !t.has_pending_snippet(); )
    t = t.parent;
  return t === null && zM(), t;
}
// @__NO_SIDE_EFFECTS__
function Gd(t) {
  var e = Qn | Si, r = jt !== null && (jt.f & Qn) !== 0 ? (
    /** @type {Derived} */
    jt
  ) : null;
  return Lt === null || r !== null && (r.f & xi) !== 0 ? e |= xi : Lt.f |= Vp, {
    ctx: ei,
    deps: null,
    effects: null,
    equals: c2,
    f: e,
    fn: t,
    reactions: null,
    rv: 0,
    v: (
      /** @type {V} */
      Hr
    ),
    wv: 0,
    parent: r ?? Lt,
    ac: null
  };
}
// @__NO_SIDE_EFFECTS__
function oR(t, e) {
  let r = (
    /** @type {Effect | null} */
    Lt
  );
  r === null && DM();
  var n = (
    /** @type {Boundary} */
    r.b
  ), a = (
    /** @type {Promise<V>} */
    /** @type {unknown} */
    void 0
  ), o = Ku(
    /** @type {V} */
    Hr
  ), l = null, u = !jt;
  return bR(() => {
    try {
      var c = t();
    } catch (m) {
      c = Promise.reject(m);
    }
    var f = () => c;
    a = l?.then(f, f) ?? Promise.resolve(c), l = a;
    var h = (
      /** @type {Batch} */
      Dr
    ), d = n.pending;
    u && (n.update_pending_count(1), d || h.increment());
    const g = (m, y = void 0) => {
      l = null, d || h.activate(), y ? y !== Zp && (o.f |= ol, Ju(o, y)) : ((o.f & ol) !== 0 && (o.f ^= ol), Ju(o, m)), u && (n.update_pending_count(-1), d || h.decrement()), R2();
    };
    if (a.then(g, (m) => g(null, m || "unknown")), h)
      return () => {
        queueMicrotask(() => h.neuter());
      };
  }), new Promise((c) => {
    function f(h) {
      function d() {
        h === a ? c(o) : f(a);
      }
      h.then(d, d);
    }
    f(a);
  });
}
// @__NO_SIDE_EFFECTS__
function Ge(t) {
  const e = /* @__PURE__ */ Gd(t);
  return z2(e), e;
}
// @__NO_SIDE_EFFECTS__
function C2(t) {
  const e = /* @__PURE__ */ Gd(t);
  return e.equals = d2, e;
}
function E2(t) {
  var e = t.effects;
  if (e !== null) {
    t.effects = null;
    for (var r = 0; r < e.length; r += 1)
      qa(
        /** @type {Effect} */
        e[r]
      );
  }
}
function lR(t) {
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
function og(t) {
  var e, r = Lt;
  ko(lR(t));
  try {
    E2(t), e = B2(t);
  } finally {
    ko(r);
  }
  return e;
}
function M2(t) {
  var e = og(t);
  if (t.equals(e) || (t.v = e, t.wv = O2()), !Ll)
    if (As !== null)
      As.set(t, t.v);
    else {
      var r = (ho || (t.f & xi) !== 0) && t.deps !== null ? Fo : rn;
      Ln(t, r);
    }
}
function sR(t, e, r) {
  const n = Gd;
  if (e.length === 0) {
    r(t.map(n));
    return;
  }
  var a = Dr, o = (
    /** @type {Effect} */
    Lt
  ), l = uR(), u = aR();
  Promise.all(e.map((c) => /* @__PURE__ */ oR(c))).then((c) => {
    a?.activate(), l();
    try {
      r([...t.map(n), ...c]);
    } catch (f) {
      (o.f & zl) === 0 && ig(f, o);
    }
    a?.deactivate(), R2();
  }).catch((c) => {
    u.error(c);
  });
}
function uR() {
  var t = Lt, e = jt, r = ei;
  return function() {
    ko(t), ca(e), od(r);
  };
}
function R2() {
  ko(null), ca(null), od(null);
}
const wu = /* @__PURE__ */ new Set();
let Dr = null, As = null, Xy = /* @__PURE__ */ new Set(), ld = [];
function T2() {
  const t = (
    /** @type {() => void} */
    ld.shift()
  );
  ld.length > 0 && queueMicrotask(T2), t();
}
let xl = [], Vd = null, qv = !1, jf = !1;
class qs {
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
  #i = [];
  /**
   * The same as `#async_effects`, but for effects inside a newly-created
   * `<svelte:boundary>` — these do not prevent the batch from committing
   * @type {Effect[]}
   */
  #a = [];
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
  #o = [];
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
      r = /* @__PURE__ */ new Map(), As = /* @__PURE__ */ new Map();
      for (const [o, l] of this.current)
        r.set(o, { v: o.v, wv: o.wv }), o.v = l;
      for (const o of wu)
        if (o !== this)
          for (const [l, u] of o.#e)
            r.has(l) || (r.set(l, { v: l.v, wv: l.wv }), l.v = u);
    }
    for (const o of e)
      this.#v(o);
    if (this.#i.length === 0 && this.#r === 0) {
      this.#h();
      var n = this.#l, a = this.#o;
      this.#l = [], this.#o = [], this.#s = [], Dr = null, Yy(n), Yy(a), Dr === null ? Dr = this : wu.delete(this), this.#n?.resolve();
    } else
      this.#d(this.#l), this.#d(this.#o), this.#d(this.#s);
    if (r) {
      for (const [o, { v: l, wv: u }] of r)
        o.wv <= u && (o.v = l);
      As = null;
    }
    for (const o of this.#i)
      Bu(o);
    for (const o of this.#a)
      Bu(o);
    this.#i = [], this.#a = [];
  }
  /**
   * Traverse the effect tree, executing effects or stashing
   * them for later execution as appropriate
   * @param {Effect} root
   */
  #v(e) {
    e.f ^= rn;
    for (var r = e.first; r !== null; ) {
      var n = r.f, a = (n & (Ua | Pl)) !== 0, o = a && (n & rn) !== 0, l = o || (n & qi) !== 0 || this.skipped_effects.has(r);
      if (!l && r.fn !== null) {
        if (a)
          r.f ^= rn;
        else if ((n & rn) === 0)
          if ((n & Hp) !== 0)
            this.#o.push(r);
          else if ((n & Yp) !== 0) {
            var u = r.b?.pending ? this.#a : this.#i;
            u.push(r);
          } else Xd(r) && ((r.f & xc) !== 0 && this.#s.push(r), Bu(r));
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
      ((r.f & Si) !== 0 ? this.#f : this.#c).push(r), Ln(r, rn);
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
    Dr = this;
  }
  deactivate() {
    Dr = null;
    for (const e of Xy)
      if (Xy.delete(e), e(), Dr !== null)
        break;
  }
  neuter() {
    this.#u = !0;
  }
  flush() {
    xl.length > 0 ? N2() : this.#h(), Dr === this && (this.#r === 0 && wu.delete(this), this.deactivate());
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
        Ln(e, Si), wl(e);
      for (const e of this.#c)
        Ln(e, Fo), wl(e);
      this.#l = [], this.#o = [], this.flush();
    } else
      this.deactivate();
  }
  /** @param {() => void} fn */
  add_callback(e) {
    this.#t.add(e);
  }
  settled() {
    return (this.#n ??= FM()).promise;
  }
  static ensure() {
    if (Dr === null) {
      const e = Dr = new qs();
      wu.add(Dr), jf || qs.enqueue(() => {
        Dr === e && e.flush();
      });
    }
    return Dr;
  }
  /** @param {() => void} task */
  static enqueue(e) {
    ld.length === 0 && queueMicrotask(T2), ld.unshift(e);
  }
}
function cR(t) {
  var e = jf;
  jf = !0;
  try {
    for (var r; ; ) {
      if (iR(), xl.length === 0 && (Dr?.flush(), xl.length === 0))
        return Vd = null, /** @type {T} */
        r;
      N2();
    }
  } finally {
    jf = e;
  }
}
function N2() {
  var t = Ss;
  qv = !0;
  try {
    var e = 0;
    for (Zy(!0); xl.length > 0; ) {
      var r = qs.ensure();
      if (e++ > 1e3) {
        var n, a;
        fR();
      }
      r.process(xl), sl.clear();
    }
  } finally {
    qv = !1, Zy(t), Vd = null;
  }
}
function fR() {
  try {
    AM();
  } catch (t) {
    ig(t, Vd);
  }
}
function Yy(t) {
  var e = t.length;
  if (e !== 0) {
    for (var r = 0; r < e; ) {
      var n = t[r++];
      if ((n.f & (zl | qi)) === 0 && Xd(n)) {
        var a = Dr ? Dr.current.size : 0;
        if (Bu(n), n.deps === null && n.first === null && n.nodes_start === null && (n.teardown === null && n.ac === null ? W2(n) : n.fn = null), Dr !== null && Dr.current.size > a && (n.f & Xp) !== 0)
          break;
      }
    }
    for (; r < e; )
      wl(t[r++]);
  }
}
function wl(t) {
  for (var e = Vd = t; e.parent !== null; ) {
    e = e.parent;
    var r = e.f;
    if (qv && e === Lt && (r & xc) !== 0)
      return;
    if ((r & (Pl | Ua)) !== 0) {
      if ((r & rn) === 0) return;
      e.f ^= rn;
    }
  }
  xl.push(e);
}
const sl = /* @__PURE__ */ new Map();
function Ku(t, e) {
  var r = {
    f: 0,
    // TODO ideally we could skip this altogether, but it causes type errors
    v: t,
    reactions: null,
    equals: c2,
    rv: 0,
    wv: 0
  };
  return r;
}
// @__NO_SIDE_EFFECTS__
function vr(t, e) {
  const r = Ku(t);
  return z2(r), r;
}
// @__NO_SIDE_EFFECTS__
function F2(t, e = !1, r = !0) {
  const n = Ku(t);
  return e || (n.equals = d2), n;
}
function at(t, e, r = !1) {
  jt !== null && // since we are untracking the function inside `$inspect.with` we need to add this check
  // to ensure we error if state is set inside an inspect effect
  (!ra || (jt.f & Wy) !== 0) && g2() && (jt.f & (Qn | xc | Yp | Wy)) !== 0 && !Oa?.includes(t) && IM();
  let n = r ? Qo(e) : e;
  return Ju(t, n);
}
function Ju(t, e) {
  if (!t.equals(e)) {
    var r = t.v;
    Ll ? sl.set(t, e) : sl.set(t, r), t.v = e;
    var n = qs.ensure();
    n.capture(t, r), (t.f & Qn) !== 0 && ((t.f & Si) !== 0 && og(
      /** @type {Derived} */
      t
    ), Ln(t, (t.f & xi) === 0 ? rn : Fo)), t.wv = O2(), P2(t, Si), Lt !== null && (Lt.f & rn) !== 0 && (Lt.f & (Ua | Pl)) === 0 && (di === null ? dR([t]) : di.push(t));
  }
  return e;
}
function P0(t) {
  at(t, t.v + 1);
}
function P2(t, e) {
  var r = t.reactions;
  if (r !== null)
    for (var n = r.length, a = 0; a < n; a++) {
      var o = r[a], l = o.f, u = (l & Si) === 0;
      u && Ln(o, e), (l & Qn) !== 0 ? P2(
        /** @type {Derived} */
        o,
        Fo
      ) : u && wl(
        /** @type {Effect} */
        o
      );
    }
}
let Ss = !1;
function Zy(t) {
  Ss = t;
}
let Ll = !1;
function Ky(t) {
  Ll = t;
}
let jt = null, ra = !1;
function ca(t) {
  jt = t;
}
let Lt = null;
function ko(t) {
  Lt = t;
}
let Oa = null;
function z2(t) {
  jt !== null && (Oa === null ? Oa = [t] : Oa.push(t));
}
let vn = null, Vn = 0, di = null;
function dR(t) {
  di = t;
}
let D2 = 1, Qu = 0, ul = Qu;
function Jy(t) {
  ul = t;
}
let ho = !1;
function O2() {
  return ++D2;
}
function Xd(t) {
  var e = t.f;
  if ((e & Si) !== 0)
    return !0;
  if ((e & Fo) !== 0) {
    var r = t.deps, n = (e & xi) !== 0;
    if (r !== null) {
      var a, o, l = (e & id) !== 0, u = n && Lt !== null && !ho, c = r.length;
      if ((l || u) && (Lt === null || (Lt.f & zl) === 0)) {
        var f = (
          /** @type {Derived} */
          t
        ), h = f.parent;
        for (a = 0; a < c; a++)
          o = r[a], (l || !o?.reactions?.includes(f)) && (o.reactions ??= []).push(f);
        l && (f.f ^= id), u && h !== null && (h.f & xi) === 0 && (f.f ^= xi);
      }
      for (a = 0; a < c; a++)
        if (o = r[a], Xd(
          /** @type {Derived} */
          o
        ) && M2(
          /** @type {Derived} */
          o
        ), o.wv > t.wv)
          return !0;
    }
    (!n || Lt !== null && !ho) && Ln(t, rn);
  }
  return !1;
}
function L2(t, e, r = !0) {
  var n = t.reactions;
  if (n !== null && !Oa?.includes(t))
    for (var a = 0; a < n.length; a++) {
      var o = n[a];
      (o.f & Qn) !== 0 ? L2(
        /** @type {Derived} */
        o,
        e,
        !1
      ) : e === o && (r ? Ln(o, Si) : (o.f & rn) !== 0 && Ln(o, Fo), wl(
        /** @type {Effect} */
        o
      ));
    }
}
function B2(t) {
  var e = vn, r = Vn, n = di, a = jt, o = ho, l = Oa, u = ei, c = ra, f = ul, h = t.f;
  vn = /** @type {null | Value[]} */
  null, Vn = 0, di = null, ho = (h & xi) !== 0 && (ra || !Ss || jt === null), jt = (h & (Ua | Pl)) === 0 ? t : null, Oa = null, od(t.ctx), ra = !1, ul = ++Qu, t.ac !== null && (t.ac.abort(Zp), t.ac = null);
  try {
    t.f |= Ov;
    var d = (
      /** @type {Function} */
      (0, t.fn)()
    ), g = t.deps;
    if (vn !== null) {
      var m;
      if (sd(t, Vn), g !== null && Vn > 0)
        for (g.length = Vn + vn.length, m = 0; m < vn.length; m++)
          g[Vn + m] = vn[m];
      else
        t.deps = g = vn;
      if (!ho || // Deriveds that already have reactions can cleanup, so we still add them as reactions
      (h & Qn) !== 0 && /** @type {import('#client').Derived} */
      t.reactions !== null)
        for (m = Vn; m < g.length; m++)
          (g[m].reactions ??= []).push(t);
    } else g !== null && Vn < g.length && (sd(t, Vn), g.length = Vn);
    if (g2() && di !== null && !ra && g !== null && (t.f & (Qn | Fo | Si)) === 0)
      for (m = 0; m < /** @type {Source[]} */
      di.length; m++)
        L2(
          di[m],
          /** @type {Effect} */
          t
        );
    return a !== null && a !== t && (Qu++, di !== null && (n === null ? n = di : n.push(.../** @type {Source[]} */
    di))), (t.f & ol) !== 0 && (t.f ^= ol), d;
  } catch (y) {
    return rR(y);
  } finally {
    t.f ^= Ov, vn = e, Vn = r, di = n, jt = a, ho = o, Oa = l, od(u), ra = c, ul = f;
  }
}
function hR(t, e) {
  let r = e.reactions;
  if (r !== null) {
    var n = RM.call(r, t);
    if (n !== -1) {
      var a = r.length - 1;
      a === 0 ? r = e.reactions = null : (r[n] = r[a], r.pop());
    }
  }
  r === null && (e.f & Qn) !== 0 && // Destroying a child effect while updating a parent effect can cause a dependency to appear
  // to be unused, when in fact it is used by the currently-updating parent. Checking `new_deps`
  // allows us to skip the expensive work of disconnecting and immediately reconnecting it
  (vn === null || !vn.includes(e)) && (Ln(e, Fo), (e.f & (xi | id)) === 0 && (e.f ^= id), E2(
    /** @type {Derived} **/
    e
  ), sd(
    /** @type {Derived} **/
    e,
    0
  ));
}
function sd(t, e) {
  var r = t.deps;
  if (r !== null)
    for (var n = e; n < r.length; n++)
      hR(t, r[n]);
}
function Bu(t) {
  var e = t.f;
  if ((e & zl) === 0) {
    Ln(t, rn);
    var r = Lt, n = Ss;
    Lt = t, Ss = !0;
    try {
      (e & xc) !== 0 ? xR(t) : H2(t), I2(t);
      var a = B2(t);
      t.teardown = typeof a == "function" ? a : null, t.wv = D2;
      var o;
      MM && HM && (t.f & Si) !== 0 && t.deps;
    } finally {
      Ss = n, Lt = r;
    }
  }
}
function O(t) {
  var e = t.f, r = (e & Qn) !== 0;
  if (jt !== null && !ra) {
    var n = Lt !== null && (Lt.f & zl) !== 0;
    if (!n && !Oa?.includes(t)) {
      var a = jt.deps;
      if ((jt.f & Ov) !== 0)
        t.rv < Qu && (t.rv = Qu, vn === null && a !== null && a[Vn] === t ? Vn++ : vn === null ? vn = [t] : (!ho || !vn.includes(t)) && vn.push(t));
      else {
        (jt.deps ??= []).push(t);
        var o = t.reactions;
        o === null ? t.reactions = [jt] : o.includes(jt) || o.push(jt);
      }
    }
  } else if (r && /** @type {Derived} */
  t.deps === null && /** @type {Derived} */
  t.effects === null) {
    var l = (
      /** @type {Derived} */
      t
    ), u = l.parent;
    u !== null && (u.f & xi) === 0 && (l.f ^= xi);
  }
  if (Ll) {
    if (sl.has(t))
      return sl.get(t);
    if (r) {
      l = /** @type {Derived} */
      t;
      var c = l.v;
      return ((l.f & rn) === 0 && l.reactions !== null || A2(l)) && (c = og(l)), sl.set(l, c), c;
    }
  } else if (r) {
    if (l = /** @type {Derived} */
    t, As?.has(l))
      return As.get(l);
    Xd(l) && M2(l);
  }
  if ((t.f & ol) !== 0)
    throw t.v;
  return t.v;
}
function A2(t) {
  if (t.v === Hr) return !0;
  if (t.deps === null) return !1;
  for (const e of t.deps)
    if (sl.has(e) || (e.f & Qn) !== 0 && A2(
      /** @type {Derived} */
      e
    ))
      return !0;
  return !1;
}
function Gs(t) {
  var e = ra;
  try {
    return ra = !0, t();
  } finally {
    ra = e;
  }
}
const vR = -7169;
function Ln(t, e) {
  t.f = t.f & vR | e;
}
function pR(t) {
  if (!(typeof t != "object" || !t || t instanceof EventTarget)) {
    if (ll in t)
      jv(t);
    else if (!Array.isArray(t))
      for (let e in t) {
        const r = t[e];
        typeof r == "object" && r && ll in r && jv(r);
      }
  }
}
function jv(t, e = /* @__PURE__ */ new Set()) {
  if (typeof t == "object" && t !== null && // We don't want to traverse DOM elements
  !(t instanceof EventTarget) && !e.has(t)) {
    e.add(t), t instanceof Date && t.getTime();
    for (let n in t)
      try {
        jv(t[n], e);
      } catch {
      }
    const r = Qp(t);
    if (r !== Object.prototype && r !== Array.prototype && r !== Map.prototype && r !== Set.prototype && r !== Date.prototype) {
      const n = s2(r);
      for (let a in n) {
        const o = n[a].get;
        if (o)
          try {
            o.call(t);
          } catch {
          }
      }
    }
  }
}
function q2(t) {
  Lt === null && jt === null && BM(), jt !== null && (jt.f & xi) !== 0 && Lt === null && LM(), Ll && OM();
}
function gR(t, e) {
  var r = e.last;
  r === null ? e.last = e.first = t : (r.next = t, t.prev = r, e.last = t);
}
function pa(t, e, r, n = !0) {
  var a = Lt;
  a !== null && (a.f & qi) !== 0 && (t |= qi);
  var o = {
    ctx: ei,
    deps: null,
    nodes_start: null,
    nodes_end: null,
    f: t | Si,
    first: null,
    fn: e,
    last: null,
    next: null,
    parent: a,
    b: a && a.b,
    prev: null,
    teardown: null,
    transitions: null,
    wv: 0,
    ac: null
  };
  if (r)
    try {
      Bu(o), o.f |= Wp;
    } catch (c) {
      throw qa(o), c;
    }
  else e !== null && wl(o);
  var l = r && o.deps === null && o.first === null && o.nodes_start === null && o.teardown === null && (o.f & Vp) === 0;
  if (!l && n && (a !== null && gR(o, a), jt !== null && (jt.f & Qn) !== 0 && (t & Pl) === 0)) {
    var u = (
      /** @type {Derived} */
      jt
    );
    (u.effects ??= []).push(o);
  }
  return o;
}
function mR(t) {
  const e = pa(Hd, null, !1);
  return Ln(e, rn), e.teardown = t, e;
}
function Ma(t) {
  q2();
  var e = (
    /** @type {Effect} */
    Lt.f
  ), r = !jt && (e & Ua) !== 0 && (e & Wp) === 0;
  if (r) {
    var n = (
      /** @type {ComponentContext} */
      ei
    );
    (n.e ??= []).push(t);
  } else
    return j2(t);
}
function j2(t) {
  return pa(Hp | Xp, t, !1);
}
function ud(t) {
  return q2(), pa(Hd | Xp, t, !0);
}
function yR(t) {
  qs.ensure();
  const e = pa(Pl, t, !0);
  return (r = {}) => new Promise((n) => {
    r.outro ? Yd(e, () => {
      qa(e), n(void 0);
    }) : (qa(e), n(void 0));
  });
}
function $2(t) {
  return pa(Hp, t, !1);
}
function bR(t) {
  return pa(Yp | Vp, t, !0);
}
function U2(t, e = 0) {
  return pa(Hd | e, t, !0);
}
function Zn(t, e = [], r = []) {
  sR(e, r, (n) => {
    pa(Hd, () => t(...n.map(O)), !0);
  });
}
function lg(t, e = 0) {
  var r = pa(xc | e, t, !0);
  return r;
}
function _l(t, e = !0) {
  return pa(Ua, t, !0, e);
}
function I2(t) {
  var e = t.teardown;
  if (e !== null) {
    const r = Ll, n = jt;
    Ky(!0), ca(null);
    try {
      e.call(null);
    } finally {
      Ky(r), ca(n);
    }
  }
}
function H2(t, e = !1) {
  var r = t.first;
  for (t.first = t.last = null; r !== null; ) {
    r.ac?.abort(Zp);
    var n = r.next;
    (r.f & Pl) !== 0 ? r.parent = null : qa(r, e), r = n;
  }
}
function xR(t) {
  for (var e = t.first; e !== null; ) {
    var r = e.next;
    (e.f & Ua) === 0 && qa(e), e = r;
  }
}
function qa(t, e = !0) {
  var r = !1;
  (e || (t.f & CM) !== 0) && t.nodes_start !== null && t.nodes_end !== null && (wR(
    t.nodes_start,
    /** @type {TemplateNode} */
    t.nodes_end
  ), r = !0), H2(t, e && !r), sd(t, 0), Ln(t, zl);
  var n = t.transitions;
  if (n !== null)
    for (const o of n)
      o.stop();
  I2(t);
  var a = t.parent;
  a !== null && a.first !== null && W2(t), t.next = t.prev = t.teardown = t.ctx = t.deps = t.fn = t.nodes_start = t.nodes_end = t.ac = null;
}
function wR(t, e) {
  for (; t !== null; ) {
    var r = t === e ? null : (
      /** @type {TemplateNode} */
      /* @__PURE__ */ Ia(t)
    );
    t.remove(), t = r;
  }
}
function W2(t) {
  var e = t.parent, r = t.prev, n = t.next;
  r !== null && (r.next = n), n !== null && (n.prev = r), e !== null && (e.first === t && (e.first = n), e.last === t && (e.last = r));
}
function Yd(t, e) {
  var r = [];
  sg(t, r, !0), G2(r, () => {
    qa(t), e && e();
  });
}
function G2(t, e) {
  var r = t.length;
  if (r > 0) {
    var n = () => --r || e();
    for (var a of t)
      a.out(n);
  } else
    e();
}
function sg(t, e, r) {
  if ((t.f & qi) === 0) {
    if (t.f ^= qi, t.transitions !== null)
      for (const l of t.transitions)
        (l.is_global || r) && e.push(l);
    for (var n = t.first; n !== null; ) {
      var a = n.next, o = (n.f & Gp) !== 0 || (n.f & Ua) !== 0;
      sg(n, e, o ? r : !1), n = a;
    }
  }
}
function ug(t) {
  V2(t, !0);
}
function V2(t, e) {
  if ((t.f & qi) !== 0) {
    t.f ^= qi, (t.f & rn) === 0 && (Ln(t, Si), wl(t));
    for (var r = t.first; r !== null; ) {
      var n = r.next, a = (r.f & Gp) !== 0 || (r.f & Ua) !== 0;
      V2(r, a ? e : !1), r = n;
    }
    if (t.transitions !== null)
      for (const o of t.transitions)
        (o.is_global || e) && o.in();
  }
}
function _R(t) {
  var e = jt, r = Lt;
  ca(null), ko(null);
  try {
    return t();
  } finally {
    ca(e), ko(r);
  }
}
const X2 = /* @__PURE__ */ new Set(), $v = /* @__PURE__ */ new Set();
function kR(t, e, r, n = {}) {
  function a(o) {
    if (n.capture || Pu.call(e, o), !o.cancelBubble)
      return _R(() => r?.call(this, o));
  }
  return t.startsWith("pointer") || t.startsWith("touch") || t === "wheel" ? ag(() => {
    e.addEventListener(t, a, n);
  }) : e.addEventListener(t, a, n), a;
}
function Qy(t, e, r, n, a) {
  var o = { capture: n, passive: a }, l = kR(t, e, r, o);
  (e === document.body || // @ts-ignore
  e === window || // @ts-ignore
  e === document || // Firefox has quirky behavior, it can happen that we still get "canplay" events when the element is already removed
  e instanceof HTMLMediaElement) && mR(() => {
    e.removeEventListener(t, l, o);
  });
}
function cg(t) {
  for (var e = 0; e < t.length; e++)
    X2.add(t[e]);
  for (var r of $v)
    r(t);
}
let eb = null;
function Pu(t) {
  var e = this, r = (
    /** @type {Node} */
    e.ownerDocument
  ), n = t.type, a = t.composedPath?.() || [], o = (
    /** @type {null | Element} */
    a[0] || t.target
  );
  eb = t;
  var l = 0, u = eb === t && t.__root;
  if (u) {
    var c = a.indexOf(u);
    if (c !== -1 && (e === document || e === /** @type {any} */
    window)) {
      t.__root = e;
      return;
    }
    var f = a.indexOf(e);
    if (f === -1)
      return;
    c <= f && (l = c);
  }
  if (o = /** @type {Element} */
  a[l] || t.target, o !== e) {
    ad(t, "currentTarget", {
      configurable: !0,
      get() {
        return o || r;
      }
    });
    var h = jt, d = Lt;
    ca(null), ko(null);
    try {
      for (var g, m = []; o !== null; ) {
        var y = o.assignedSlot || o.parentNode || /** @type {any} */
        o.host || null;
        try {
          var w = o["__" + n];
          if (w != null && (!/** @type {any} */
          o.disabled || // DOM could've been updated already by the time this is reached, so we check this as well
          // -> the target could not have been disabled because it emits the event in the first place
          t.target === o))
            if (Kp(w)) {
              var [x, ..._] = w;
              x.apply(o, [t, ..._]);
            } else
              w.call(o, t);
        } catch (S) {
          g ? m.push(S) : g = S;
        }
        if (t.cancelBubble || y === e || y === null)
          break;
        o = y;
      }
      if (g) {
        for (let S of m)
          queueMicrotask(() => {
            throw S;
          });
        throw g;
      }
    } finally {
      t.__root = e, delete t.currentTarget, ca(h), ko(d);
    }
  }
}
function Y2(t) {
  var e = document.createElement("template");
  return e.innerHTML = t.replaceAll("<!>", "<!---->"), e.content;
}
function xo(t, e) {
  var r = (
    /** @type {Effect} */
    Lt
  );
  r.nodes_start === null && (r.nodes_start = t, r.nodes_end = e);
}
// @__NO_SIDE_EFFECTS__
function Po(t, e) {
  var r = (e & KM) !== 0, n = (e & JM) !== 0, a, o = !t.startsWith("<!>");
  return () => {
    if (tr)
      return xo(Zt, null), Zt;
    a === void 0 && (a = Y2(o ? t : "<!>" + t), r || (a = /** @type {Node} */
    /* @__PURE__ */ Aa(a)));
    var l = (
      /** @type {TemplateNode} */
      n || y2 ? document.importNode(a, !0) : a.cloneNode(!0)
    );
    if (r) {
      var u = (
        /** @type {TemplateNode} */
        /* @__PURE__ */ Aa(l)
      ), c = (
        /** @type {TemplateNode} */
        l.lastChild
      );
      xo(u, c);
    } else
      xo(l, l);
    return l;
  };
}
// @__NO_SIDE_EFFECTS__
function SR(t, e, r = "svg") {
  var n = !t.startsWith("<!>"), a = `<${r}>${n ? t : "<!>" + t}</${r}>`, o;
  return () => {
    if (tr)
      return xo(Zt, null), Zt;
    if (!o) {
      var l = (
        /** @type {DocumentFragment} */
        Y2(a)
      ), u = (
        /** @type {Element} */
        /* @__PURE__ */ Aa(l)
      );
      o = /** @type {Element} */
      /* @__PURE__ */ Aa(u);
    }
    var c = (
      /** @type {TemplateNode} */
      o.cloneNode(!0)
    );
    return xo(c, c), c;
  };
}
// @__NO_SIDE_EFFECTS__
function Ha(t, e) {
  return /* @__PURE__ */ SR(t, e, "svg");
}
function _u() {
  if (tr)
    return xo(Zt, null), Zt;
  var t = document.createDocumentFragment(), e = document.createComment(""), r = _o();
  return t.append(e, r), xo(e, r), t;
}
function kr(t, e) {
  if (tr) {
    Lt.nodes_end = Zt, wc();
    return;
  }
  t !== null && t.before(
    /** @type {Node} */
    e
  );
}
const CR = ["touchstart", "touchmove"];
function ER(t) {
  return CR.includes(t);
}
function Au(t, e) {
  var r = e == null ? "" : typeof e == "object" ? e + "" : e;
  r !== (t.__t ??= t.nodeValue) && (t.__t = r, t.nodeValue = r + "");
}
function Z2(t, e) {
  return K2(t, e);
}
function MR(t, e) {
  Bv(), e.intro = e.intro ?? !1;
  const r = e.target, n = tr, a = Zt;
  try {
    for (var o = (
      /** @type {TemplateNode} */
      /* @__PURE__ */ Aa(r)
    ); o && (o.nodeType !== Yu || /** @type {Comment} */
    o.data !== p2); )
      o = /** @type {TemplateNode} */
      /* @__PURE__ */ Ia(o);
    if (!o)
      throw ks;
    Ta(!0), ji(
      /** @type {Comment} */
      o
    ), wc();
    const l = K2(t, { ...e, anchor: o });
    if (Zt === null || Zt.nodeType !== Yu || /** @type {Comment} */
    Zt.data !== ng)
      throw Wd(), ks;
    return Ta(!1), /**  @type {Exports} */
    l;
  } catch (l) {
    if (l === ks)
      return e.recover === !1 && qM(), Bv(), w2(r), Ta(!1), Z2(t, e);
    throw l;
  } finally {
    Ta(n), ji(a);
  }
}
const ds = /* @__PURE__ */ new Map();
function K2(t, { target: e, anchor: r, props: n = {}, events: a, context: o, intro: l = !0 }) {
  Bv();
  var u = /* @__PURE__ */ new Set(), c = (d) => {
    for (var g = 0; g < d.length; g++) {
      var m = d[g];
      if (!u.has(m)) {
        u.add(m);
        var y = ER(m);
        e.addEventListener(m, Pu, { passive: y });
        var w = ds.get(m);
        w === void 0 ? (document.addEventListener(m, Pu, { passive: y }), ds.set(m, 1)) : ds.set(m, w + 1);
      }
    }
  };
  c(Jp(X2)), $v.add(c);
  var f = void 0, h = yR(() => {
    var d = r ?? e.appendChild(_o());
    return _l(() => {
      if (o) {
        Dl({});
        var g = (
          /** @type {ComponentContext} */
          ei
        );
        g.c = o;
      }
      a && (n.$$events = a), tr && xo(
        /** @type {TemplateNode} */
        d,
        null
      ), f = t(d, n) || {}, tr && (Lt.nodes_end = Zt), o && Ol();
    }), () => {
      for (var g of u) {
        e.removeEventListener(g, Pu);
        var m = (
          /** @type {number} */
          ds.get(g)
        );
        --m === 0 ? (document.removeEventListener(g, Pu), ds.delete(g)) : ds.set(g, m);
      }
      $v.delete(c), d !== r && d.parentNode?.removeChild(d);
    };
  });
  return Uv.set(f, h), f;
}
let Uv = /* @__PURE__ */ new WeakMap();
function RR(t, e) {
  const r = Uv.get(t);
  return r ? (Uv.delete(t), r(e)) : Promise.resolve();
}
function TR(t) {
  return new NR(t);
}
class NR {
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
    var r = /* @__PURE__ */ new Map(), n = (o, l) => {
      var u = /* @__PURE__ */ F2(l, !1, !1);
      return r.set(o, u), u;
    };
    const a = new Proxy(
      { ...e.props || {}, $$events: {} },
      {
        get(o, l) {
          return O(r.get(l) ?? n(l, Reflect.get(o, l)));
        },
        has(o, l) {
          return l === o2 ? !0 : (O(r.get(l) ?? n(l, Reflect.get(o, l))), Reflect.has(o, l));
        },
        set(o, l, u) {
          return at(r.get(l) ?? n(l, u), u), Reflect.set(o, l, u);
        }
      }
    );
    this.#t = (e.hydrate ? MR : Z2)(e.component, {
      target: e.target,
      anchor: e.anchor,
      props: a,
      context: e.context,
      intro: e.intro ?? !1,
      recover: e.recover
    }), (!e?.props?.$$host || e.sync === !1) && cR(), this.#e = a.$$events;
    for (const o of Object.keys(this.#t))
      o === "$set" || o === "$destroy" || o === "$on" || ad(this, o, {
        get() {
          return this.#t[o];
        },
        /** @param {any} value */
        set(l) {
          this.#t[o] = l;
        },
        enumerable: !0
      });
    this.#t.$set = /** @param {Record<string, any>} next */
    (o) => {
      Object.assign(a, o);
    }, this.#t.$destroy = () => {
      RR(this.#t);
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
    const n = (...a) => r.call(this, ...a);
    return this.#e[e].push(n), () => {
      this.#e[e] = this.#e[e].filter(
        /** @param {any} fn */
        (a) => a !== n
      );
    };
  }
  $destroy() {
    this.#t.$destroy();
  }
}
const FR = "5";
typeof window < "u" && ((window.__svelte ??= {}).v ??= /* @__PURE__ */ new Set()).add(FR);
function fg(t) {
  ei === null && h2(), Ma(() => {
    const e = Gs(t);
    if (typeof e == "function") return (
      /** @type {() => void} */
      e
    );
  });
}
function PR(t) {
  ei === null && h2(), fg(() => () => Gs(t));
}
function Mn(t, e, r = !1) {
  tr && wc();
  var n = t, a = null, o = null, l = Hr, u = r ? Gp : 0, c = !1;
  const f = (g, m = !0) => {
    c = !0, d(m, g);
  };
  function h() {
    var g = l ? a : o, m = l ? o : a;
    g && ug(g), m && Yd(m, () => {
      l ? o = null : a = null;
    });
  }
  const d = (g, m) => {
    if (l === (l = g)) return;
    let y = !1;
    if (tr) {
      const _ = m2(n) === rg;
      !!l === _ && (n = Lv(), ji(n), Ta(!1), y = !0);
    }
    var w = _2(), x = n;
    l ? a ??= m && _l(() => m(x)) : o ??= m && _l(() => m(x)), w || h(), y && Ta(!0);
  };
  lg(() => {
    c = !1, e(f), c || d(null, null);
  }, u), tr && (n = Zt);
}
function zR(t, e, r) {
  tr && wc();
  var n = t, a = Hr, o, l, u = null, c = PM;
  function f() {
    o && Yd(o), u !== null && (u.lastChild.remove(), n.before(u), u = null), o = l;
  }
  lg(() => {
    if (c(a, a = e())) {
      var h = n, d = _2();
      d && (u = document.createDocumentFragment(), u.append(h = _o())), l = _l(() => r(h)), d ? Dr.add_callback(f) : f();
    }
  }), tr && (n = Zt);
}
function z0(t, e) {
  return e;
}
function DR(t, e, r) {
  for (var n = t.items, a = [], o = e.length, l = 0; l < o; l++)
    sg(e[l].e, a, !0);
  var u = o > 0 && a.length === 0 && r !== null;
  if (u) {
    var c = (
      /** @type {Element} */
      /** @type {Element} */
      r.parentNode
    );
    w2(c), c.append(
      /** @type {Element} */
      r
    ), n.clear(), Qi(t, e[0].prev, e[o - 1].next);
  }
  G2(a, () => {
    for (var f = 0; f < o; f++) {
      var h = e[f];
      u || (n.delete(h.k), Qi(t, h.prev, h.next)), qa(h.e, !u);
    }
  });
}
function D0(t, e, r, n, a, o = null) {
  var l = t, u = { flags: e, items: /* @__PURE__ */ new Map(), first: null }, c = (e & v2) !== 0;
  if (c) {
    var f = (
      /** @type {Element} */
      t
    );
    l = tr ? ji(
      /** @type {Comment | Text} */
      /* @__PURE__ */ Aa(f)
    ) : f.appendChild(_o());
  }
  tr && wc();
  var h = null, d = !1, g = /* @__PURE__ */ new Map(), m = /* @__PURE__ */ C2(() => {
    var _ = r();
    return Kp(_) ? _ : _ == null ? [] : Jp(_);
  }), y, w;
  function x() {
    OR(
      w,
      y,
      u,
      g,
      l,
      a,
      e,
      n,
      r
    ), o !== null && (y.length === 0 ? h ? ug(h) : h = _l(() => o(l)) : h !== null && Yd(h, () => {
      h = null;
    }));
  }
  lg(() => {
    w ??= /** @type {Effect} */
    Lt, y = O(m);
    var _ = y.length;
    if (d && _ === 0)
      return;
    d = _ === 0;
    let S = !1;
    if (tr) {
      var k = m2(l) === rg;
      k !== (_ === 0) && (l = Lv(), ji(l), Ta(!1), S = !0);
    }
    if (tr) {
      for (var T = null, E, M = 0; M < _; M++) {
        if (Zt.nodeType === Yu && /** @type {Comment} */
        Zt.data === ng) {
          l = /** @type {Comment} */
          Zt, S = !0, Ta(!1);
          break;
        }
        var R = y[M], z = n(R, M);
        E = J2(
          Zt,
          u,
          T,
          null,
          R,
          z,
          M,
          a,
          e,
          r
        ), u.items.set(z, E), T = E;
      }
      _ > 0 && ji(Lv());
    }
    tr ? _ === 0 && o && (h = _l(() => o(l))) : x(), S && Ta(!0), O(m);
  }), tr && (l = Zt);
}
function OR(t, e, r, n, a, o, l, u, c) {
  var f = (l & WM) !== 0, h = (l & (eg | tg)) !== 0, d = e.length, g = r.items, m = r.first, y = m, w, x = null, _, S = [], k = [], T, E, M, R;
  if (f)
    for (R = 0; R < d; R += 1)
      T = e[R], E = u(T, R), M = g.get(E), M !== void 0 && (M.a?.measure(), (_ ??= /* @__PURE__ */ new Set()).add(M));
  for (R = 0; R < d; R += 1) {
    if (T = e[R], E = u(T, R), M = g.get(E), M === void 0) {
      var z = n.get(E);
      if (z !== void 0) {
        n.delete(E), g.set(E, z);
        var B = x ? x.next : y;
        Qi(r, x, z), Qi(r, z, B), O0(z, B, a), x = z;
      } else {
        var $ = y ? (
          /** @type {TemplateNode} */
          y.e.nodes_start
        ) : a;
        x = J2(
          $,
          r,
          x,
          x === null ? r.first : x.next,
          T,
          E,
          R,
          o,
          l,
          c
        );
      }
      g.set(E, x), S = [], k = [], y = x.next;
      continue;
    }
    if (h && LR(M, T, R, l), (M.e.f & qi) !== 0 && (ug(M.e), f && (M.a?.unfix(), (_ ??= /* @__PURE__ */ new Set()).delete(M))), M !== y) {
      if (w !== void 0 && w.has(M)) {
        if (S.length < k.length) {
          var L = k[0], q;
          x = L.prev;
          var j = S[0], W = S[S.length - 1];
          for (q = 0; q < S.length; q += 1)
            O0(S[q], L, a);
          for (q = 0; q < k.length; q += 1)
            w.delete(k[q]);
          Qi(r, j.prev, W.next), Qi(r, x, j), Qi(r, W, L), y = L, x = W, R -= 1, S = [], k = [];
        } else
          w.delete(M), O0(M, y, a), Qi(r, M.prev, M.next), Qi(r, M, x === null ? r.first : x.next), Qi(r, x, M), x = M;
        continue;
      }
      for (S = [], k = []; y !== null && y.k !== E; )
        (y.e.f & qi) === 0 && (w ??= /* @__PURE__ */ new Set()).add(y), k.push(y), y = y.next;
      if (y === null)
        continue;
      M = y;
    }
    S.push(M), x = M, y = M.next;
  }
  if (y !== null || w !== void 0) {
    for (var Y = w === void 0 ? [] : Jp(w); y !== null; )
      (y.e.f & qi) === 0 && Y.push(y), y = y.next;
    var G = Y.length;
    if (G > 0) {
      var X = (l & v2) !== 0 && d === 0 ? a : null;
      if (f) {
        for (R = 0; R < G; R += 1)
          Y[R].a?.measure();
        for (R = 0; R < G; R += 1)
          Y[R].a?.fix();
      }
      DR(r, Y, X);
    }
  }
  f && ag(() => {
    if (_ !== void 0)
      for (M of _)
        M.a?.apply();
  }), t.first = r.first && r.first.e, t.last = x && x.e;
  for (var K of n.values())
    qa(K.e);
  n.clear();
}
function LR(t, e, r, n) {
  (n & eg) !== 0 && Ju(t.v, e), (n & tg) !== 0 ? Ju(
    /** @type {Value<number>} */
    t.i,
    r
  ) : t.i = r;
}
function J2(t, e, r, n, a, o, l, u, c, f, h) {
  var d = (c & eg) !== 0, g = (c & GM) === 0, m = d ? g ? /* @__PURE__ */ F2(a, !1, !1) : Ku(a) : a, y = (c & tg) === 0 ? l : Ku(l), w = {
    i: y,
    v: m,
    k: o,
    a: null,
    // @ts-expect-error
    e: null,
    prev: r,
    next: n
  };
  try {
    if (t === null) {
      var x = document.createDocumentFragment();
      x.append(t = _o());
    }
    return w.e = _l(() => u(
      /** @type {Node} */
      t,
      m,
      y,
      f
    ), tr), w.e.prev = r && r.e, w.e.next = n && n.e, r === null ? h || (e.first = w) : (r.next = w, r.e.next = w.e), n !== null && (n.prev = w, n.e.prev = w.e), w;
  } finally {
  }
}
function O0(t, e, r) {
  for (var n = t.next ? (
    /** @type {TemplateNode} */
    t.next.e.nodes_start
  ) : r, a = e ? (
    /** @type {TemplateNode} */
    e.e.nodes_start
  ) : r, o = (
    /** @type {TemplateNode} */
    t.e.nodes_start
  ); o !== null && o !== n; ) {
    var l = (
      /** @type {TemplateNode} */
      /* @__PURE__ */ Ia(o)
    );
    a.before(o), o = l;
  }
}
function Qi(t, e, r) {
  e === null ? t.first = r : (e.next = r, e.e.next = r && r.e), r !== null && (r.prev = e, r.e.prev = e && e.e);
}
function BR(t, e, r) {
  $2(() => {
    var n = Gs(() => e(t, r?.()) || {});
    if (r && n?.update) {
      var a = !1, o = (
        /** @type {any} */
        {}
      );
      U2(() => {
        var l = r();
        pR(l), a && f2(o, l) && (o = l, n.update(l));
      }), a = !0;
    }
    if (n?.destroy)
      return () => (
        /** @type {Function} */
        n.destroy()
      );
  });
}
function tb(t, e = !1) {
  var r = e ? " !important;" : ";", n = "";
  for (var a in t) {
    var o = t[a];
    o != null && o !== "" && (n += " " + a + ": " + o + r);
  }
  return n;
}
function AR(t, e) {
  if (e) {
    var r = "", n, a;
    return Array.isArray(e) ? (n = e[0], a = e[1]) : n = e, n && (r += tb(n)), a && (r += tb(a, !0)), r = r.trim(), r === "" ? null : r;
  }
  return String(t);
}
function L0(t, e = {}, r, n) {
  for (var a in r) {
    var o = r[a];
    e[a] !== o && (r[a] == null ? t.style.removeProperty(a) : t.style.setProperty(a, o, n));
  }
}
function qt(t, e, r, n) {
  var a = t.__style;
  if (tr || a !== e) {
    var o = AR(e, n);
    (!tr || o !== t.getAttribute("style")) && (o == null ? t.removeAttribute("style") : t.style.cssText = o), t.__style = e;
  } else n && (Array.isArray(n) ? (L0(t, r?.[0], n[0]), L0(t, r?.[1], n[1], "important")) : L0(t, r, n));
  return n;
}
const qR = Symbol("is custom element"), jR = Symbol("is html");
function Ae(t, e, r, n) {
  var a = $R(t);
  tr && (a[e] = t.getAttribute(e), e === "src" || e === "srcset" || e === "href" && t.nodeName === "LINK") || a[e] !== (a[e] = r) && (e === "loading" && (t[EM] = r), r == null ? t.removeAttribute(e) : typeof r != "string" && UR(t).includes(e) ? t[e] = r : t.setAttribute(e, r));
}
function $R(t) {
  return (
    /** @type {Record<string | symbol, unknown>} **/
    // @ts-expect-error
    t.__attributes ??= {
      [qR]: t.nodeName.includes("-"),
      [jR]: t.namespaceURI === QM
    }
  );
}
var rb = /* @__PURE__ */ new Map();
function UR(t) {
  var e = rb.get(t.nodeName);
  if (e) return e;
  rb.set(t.nodeName, e = []);
  for (var r, n = t, a = Element.prototype; a !== n; ) {
    r = s2(n);
    for (var o in r)
      r[o].set && e.push(o);
    n = Qp(n);
  }
  return e;
}
function nb(t, e) {
  return t === e || t?.[ll] === e;
}
function Iv(t = {}, e, r, n) {
  return $2(() => {
    var a, o;
    return U2(() => {
      a = o, o = [], Gs(() => {
        t !== r(...o) && (e(t, ...o), a && nb(r(...a), t) && e(null, ...a));
      });
    }), () => {
      ag(() => {
        o && nb(r(...o), t) && e(null, ...o);
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
function Ye(t, e, r, n) {
  var a = (r & YM) !== 0, o = (r & ZM) !== 0, l = (
    /** @type {V} */
    n
  ), u = !0, c = () => (u && (u = !1, l = o ? Gs(
    /** @type {() => V} */
    n
  ) : (
    /** @type {V} */
    n
  )), l), f;
  if (a) {
    var h = ll in t || o2 in t;
    f = _s(t, e)?.set ?? (h && e in t ? (S) => t[e] = S : void 0);
  }
  var d, g = !1;
  a ? [d, g] = IR(() => (
    /** @type {V} */
    t[e]
  )) : d = /** @type {V} */
  t[e], d === void 0 && n !== void 0 && (d = c(), f && (jM(), f(d)));
  var m;
  if (m = () => {
    var S = (
      /** @type {V} */
      t[e]
    );
    return S === void 0 ? c() : (u = !0, S);
  }, (r & XM) === 0)
    return m;
  if (f) {
    var y = t.$$legacy;
    return function(S, k) {
      return arguments.length > 0 ? ((!k || y || g) && f(k ? m() : S), S) : m();
    };
  }
  var w = !1, x = ((r & VM) !== 0 ? Gd : C2)(() => (w = !1, m()));
  a && O(x);
  var _ = (
    /** @type {Effect} */
    Lt
  );
  return function(S, k) {
    if (arguments.length > 0) {
      const T = k ? O(x) : a ? Qo(S) : S;
      return at(x, T), w = !0, l !== void 0 && (l = T), S;
    }
    return Ll && w || (_.f & zl) !== 0 ? x.v : O(x);
  };
}
var HR = /* @__PURE__ */ Ha('<g><rect role="none"></rect><rect role="none"></rect><rect role="none"></rect><rect role="none"></rect><rect role="none"></rect><rect role="none"></rect><rect role="none"></rect><rect role="none"></rect><rect role="none"></rect></g>');
function WR(t, e) {
  Dl(e, !0);
  let r = /* @__PURE__ */ Ge(() => e.pointLocation(e.value.xMin, e.value.yMin)), n = /* @__PURE__ */ Ge(() => e.pointLocation(e.value.xMax, e.value.yMax));
  const a = 8;
  function o(B) {
    return ($) => {
      $.stopPropagation(), $.preventDefault(), e.preventHover(!0);
      let L = [O(r).x, O(r).y, O(n).x, O(n).y], q = (W) => {
        W.preventDefault();
        let Y = W.pageX - $.pageX, G = W.pageY - $.pageY, X = [Y, G, Y, G].map((U, Z) => L[Z] + U * B[Z]), K = e.coordinateAtPoint(X[0], X[1]), V = e.coordinateAtPoint(X[2], X[3]);
        e.onChange({
          xMin: Math.min(K.x, V.x),
          xMax: Math.max(K.x, V.x),
          yMin: Math.min(K.y, V.y),
          yMax: Math.max(K.y, V.y)
        });
      }, j = () => {
        e.preventHover(!1), window.removeEventListener("mousemove", q), window.removeEventListener("mouseup", j);
      };
      window.addEventListener("mousemove", q), window.addEventListener("mouseup", j);
    };
  }
  var l = HR(), u = Gr(l), c = /* @__PURE__ */ Ge(() => o([1, 1, 1, 1]));
  u.__mousedown = function(...B) {
    O(c)?.apply(this, B);
  }, qt(u, "", {}, {
    stroke: "#fff",
    fill: "rgba(128,128,128,0.25)",
    cursor: "move"
  });
  var f = mr(u);
  Ae(f, "width", a);
  var h = /* @__PURE__ */ Ge(() => o([1, 0, 0, 0]));
  f.__mousedown = function(...B) {
    O(h)?.apply(this, B);
  }, qt(f, "", {}, {
    cursor: "ew-resize",
    stroke: "none",
    fill: "none",
    "pointer-events": "all"
  });
  var d = mr(f);
  Ae(d, "width", a);
  var g = /* @__PURE__ */ Ge(() => o([0, 0, 1, 0]));
  d.__mousedown = function(...B) {
    O(g)?.apply(this, B);
  }, qt(d, "", {}, {
    cursor: "ew-resize",
    stroke: "none",
    fill: "none",
    "pointer-events": "all"
  });
  var m = mr(d);
  Ae(m, "height", a);
  var y = /* @__PURE__ */ Ge(() => o([0, 1, 0, 0]));
  m.__mousedown = function(...B) {
    O(y)?.apply(this, B);
  }, qt(m, "", {}, {
    cursor: "ns-resize",
    stroke: "none",
    fill: "none",
    "pointer-events": "all"
  });
  var w = mr(m);
  Ae(w, "height", a);
  var x = /* @__PURE__ */ Ge(() => o([0, 0, 0, 1]));
  w.__mousedown = function(...B) {
    O(x)?.apply(this, B);
  }, qt(w, "", {}, {
    cursor: "ns-resize",
    stroke: "none",
    fill: "none",
    "pointer-events": "all"
  });
  var _ = mr(w);
  Ae(_, "width", a), Ae(_, "height", a);
  var S = /* @__PURE__ */ Ge(() => o([1, 1, 0, 0]));
  _.__mousedown = function(...B) {
    O(S)?.apply(this, B);
  }, qt(_, "", {}, {
    cursor: "nesw-resize",
    stroke: "none",
    fill: "none",
    "pointer-events": "all"
  });
  var k = mr(_);
  Ae(k, "width", a), Ae(k, "height", a);
  var T = /* @__PURE__ */ Ge(() => o([1, 0, 0, 1]));
  k.__mousedown = function(...B) {
    O(T)?.apply(this, B);
  }, qt(k, "", {}, {
    cursor: "nwse-resize",
    stroke: "none",
    fill: "none",
    "pointer-events": "all"
  });
  var E = mr(k);
  Ae(E, "width", a), Ae(E, "height", a);
  var M = /* @__PURE__ */ Ge(() => o([0, 1, 1, 0]));
  E.__mousedown = function(...B) {
    O(M)?.apply(this, B);
  }, qt(E, "", {}, {
    cursor: "nwse-resize",
    stroke: "none",
    fill: "none",
    "pointer-events": "all"
  });
  var R = mr(E);
  Ae(R, "width", a), Ae(R, "height", a);
  var z = /* @__PURE__ */ Ge(() => o([0, 0, 1, 1]));
  R.__mousedown = function(...B) {
    O(z)?.apply(this, B);
  }, qt(R, "", {}, {
    cursor: "nesw-resize",
    stroke: "none",
    fill: "none",
    "pointer-events": "all"
  }), Lr(l), Zn(
    (B, $, L, q, j, W, Y, G, X, K, V, U) => {
      Ae(u, "x", B), Ae(u, "width", $), Ae(u, "y", L), Ae(u, "height", q), Ae(f, "x", O(r).x - a / 2), Ae(f, "y", j), Ae(f, "height", W), Ae(d, "x", O(n).x - a / 2), Ae(d, "y", Y), Ae(d, "height", G), Ae(m, "x", X), Ae(m, "width", K), Ae(m, "y", O(r).y - a / 2), Ae(w, "x", V), Ae(w, "width", U), Ae(w, "y", O(n).y - a / 2), Ae(_, "x", O(r).x - a / 2), Ae(_, "y", O(r).y - a / 2), Ae(k, "x", O(r).x - a / 2), Ae(k, "y", O(n).y - a / 2), Ae(E, "x", O(n).x - a / 2), Ae(E, "y", O(r).y - a / 2), Ae(R, "x", O(n).x - a / 2), Ae(R, "y", O(n).y - a / 2);
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
cg(["mousedown"]);
function GR(t, e) {
  let r = !1, n, a, o, l = 300, u = 300, c = async (h) => {
    r = !0;
    try {
      await t(h);
    } catch (d) {
      console.error(d);
    }
    if (r = !1, n !== void 0) {
      let d = n;
      n = void 0, f(d);
    }
  }, f = async (h) => {
    if (r) {
      n = h;
      return;
    }
    let d = (/* @__PURE__ */ new Date()).getTime();
    e() && (a = d);
    let g = !0;
    (a == null || d - a < u) && (g = !1), g ? (o && clearTimeout(o), o = setTimeout(() => c(h), l)) : c(h);
  };
  return f;
}
function B0(t) {
  return { shift: t.shiftKey, ctrl: t.ctrlKey, alt: t.altKey, meta: t.metaKey };
}
function VR(t, e) {
  let { zoom: r, click: n, drag: a, hover: o } = e, l = !1, u = !1, c = null, f = n == null ? 0 : 5;
  return {
    wheel: (h) => {
      if (r == null)
        return;
      h.preventDefault();
      let d = t.getBoundingClientRect(), g = h.clientX - d.left, m = h.clientY - d.top, y = Math.exp(-h.deltaY / 200);
      r(y, { x: g, y: m }, B0(h));
    },
    mousedown: (h) => {
      h.preventDefault();
      let d = t.getBoundingClientRect(), g = h.clientX - d.left, m = h.clientY - d.top, y = !1, w = null;
      l = !0;
      let x = (S) => {
        S.preventDefault();
        let k = t.getBoundingClientRect(), T = S.clientX - k.left, E = S.clientY - k.top;
        y == !1 && a != null && (T - g) * (T - g) + (E - m) * (E - m) > f * f && (y = !0, w = a({ x: g, y: m }, B0(h))), y && w?.move != null && w.move({ x: T, y: E });
      }, _ = () => {
        window.removeEventListener("mousemove", x), window.removeEventListener("mouseup", _), l = !1, y && w?.release != null && w.release(), y || n && n({ x: g, y: m }, B0(h));
      };
      window.addEventListener("mousemove", x), window.addEventListener("mouseup", _);
    },
    mousemove: (h) => {
      if (o == null || l || u)
        return;
      let d = t.getBoundingClientRect(), g = h.clientX - d.left, m = h.clientY - d.top;
      c = { x: g, y: m }, o({ x: g, y: m });
    },
    mouseleave: () => {
      c != null && o != null && (c = null, o(null));
    },
    preventHover: (h) => {
      h != u && (h && c != null && o != null && (c = null, o(null)), u = h);
    }
  };
}
function XR(t, e) {
  let r = t.x - e.x, n = t.y - e.y;
  return Math.sqrt(r * r + n * n);
}
function YR(t) {
  return "M " + t.map(({ x: e, y: r }) => `${e},${r}`).join(" L ") + " Z";
}
function Q2(t) {
  let e = 1 / 0, r = -1 / 0, n = 1 / 0, a = -1 / 0;
  for (let { x: o, y: l } of t)
    e = Math.min(e, o), n = Math.min(n, l), r = Math.max(r, o), a = Math.max(a, l);
  return { xMin: e, yMin: n, xMax: r, yMax: a };
}
async function ZR(t) {
  let e = JSON.stringify(t), r = new TextEncoder().encode(e), n = await crypto.subtle.digest("SHA-1", r);
  return Array.from(new Uint8Array(n)).map((a) => a.toString(16).padStart(2, "0")).join("");
}
function vo(t, e) {
  if (t === e)
    return !0;
  if (t === null || e === null || typeof t != "object" || typeof e != "object" || Object.keys(t).length !== Object.keys(e).length)
    return !1;
  for (let r in t)
    if (e.hasOwnProperty(r)) {
      if (!vo(t[r], e[r]))
        return !1;
    } else
      return !1;
  return !0;
}
var KR = /* @__PURE__ */ Ha("<path></path>");
function JR(t, e) {
  Dl(e, !0);
  let r = /* @__PURE__ */ Ge(() => e.value.map(({ x: a, y: o }) => e.pointLocation(a, o)));
  var n = KR();
  qt(n, "", {}, { stroke: "#fff", fill: "rgba(128,128,128,0.25)" }), Zn((a) => Ae(n, "d", a), [() => YR(O(r))]), kr(t, n), Ol();
}
const QR = {
  marquee: "M7 5a2 2 0 1 1-4 0a2 2 0 0 1 4 0m1-.25c0 .414.336.75.75.75h6.5a.75.75 0 0 0 0-1.5h-6.5a.75.75 0 0 0-.75.75M4.75 8a.75.75 0 0 0-.75.75v6.5a.75.75 0 0 0 1.5 0v-6.5A.75.75 0 0 0 4.75 8m14.5 0a.75.75 0 0 0-.75.75v6.5a.75.75 0 0 0 1.5 0v-6.5a.75.75 0 0 0-.75-.75M8.75 20a.75.75 0 0 1 0-1.5h6.5a.75.75 0 0 1 0 1.5zM5 21a2 2 0 1 0 0-4a2 2 0 0 0 0 4M21 5a2 2 0 1 1-4 0a2 2 0 0 1 4 0m-2 16a2 2 0 1 0 0-4a2 2 0 0 0 0 4",
  lasso: "M9.703 2.265A10 10 0 0 1 12 2c.79 0 1.559.092 2.297.265a.75.75 0 1 1-.343 1.46A8.5 8.5 0 0 0 12 3.5a8.6 8.6 0 0 0-1.954.225a.75.75 0 1 1-.343-1.46m-1.93 1.47a.75.75 0 0 1-.242 1.033a8.55 8.55 0 0 0-2.763 2.763a.75.75 0 1 1-1.275-.79a10.05 10.05 0 0 1 3.248-3.248a.75.75 0 0 1 1.032.243m8.454 0a.75.75 0 0 1 1.032-.242a10.05 10.05 0 0 1 3.248 3.248a.75.75 0 1 1-1.275.79a8.55 8.55 0 0 0-2.763-2.763a.75.75 0 0 1-.242-1.032m-13.06 5.41a.75.75 0 0 1 .558.901A8.5 8.5 0 0 0 3.5 12c0 .673.078 1.327.225 1.954a.75.75 0 1 1-1.46.343A10 10 0 0 1 2 12c0-.79.092-1.559.265-2.297a.75.75 0 0 1 .902-.559m17.666 0a.75.75 0 0 1 .902.558a10.1 10.1 0 0 1 0 4.595a.75.75 0 1 1-1.46-.343a8.54 8.54 0 0 0-.001-3.908a.75.75 0 0 1 .559-.902M3.736 16.226a.75.75 0 0 1 1.032.242a8.55 8.55 0 0 0 2.763 2.763a.75.75 0 0 1-.79 1.275a10.05 10.05 0 0 1-3.248-3.248a.75.75 0 0 1 .243-1.032m16.685.858a.75.75 0 1 0-1.342-.67l-.002.004l-.015.029l-.069.123a8 8 0 0 1-.289.466a9.6 9.6 0 0 1-.965 1.219c-1.17-1.073-2.756-2.006-4.74-2.006c-2.347 0-3.99 1.203-3.99 2.875S10.653 22 13 22c1.942 0 3.495-.75 4.658-1.645a11.7 11.7 0 0 1 1.315 2.01q.05.099.073.149l.017.035l.004.009a.75.75 0 0 0 1.368-.615c-.087-.183 0-.001 0-.001v-.002l-.003-.004l-.007-.015l-.024-.052l-.091-.184a13.2 13.2 0 0 0-1.538-2.337a11 11 0 0 0 1.525-2.032l.09-.162l.024-.047l.007-.014l.002-.005zM13 17.75c1.433 0 2.644.652 3.616 1.512c-.95.7-2.155 1.238-3.616 1.238c-1.973 0-2.49-.922-2.49-1.375s.517-1.375 2.49-1.375"
};
var e9 = /* @__PURE__ */ Ha('<svg width="24" height="24" viewBox="0 0 24 24"><path></path></svg>'), t9 = /* @__PURE__ */ Po("<button><!></button>");
function ib(t, e) {
  let r = Ye(e, "active", 3, !1);
  var n = t9();
  n.__click = function(...u) {
    e.onClick?.apply(this, u);
  };
  let a;
  var o = Gr(n);
  {
    var l = (u) => {
      var c = e9();
      qt(c, "", {}, { width: "14px", height: "14px" });
      var f = Gr(c);
      qt(f, "", {}, { fill: "currentColor" }), Lr(c), Zn(() => Ae(f, "d", QR[e.icon])), kr(u, c);
    };
    Mn(o, (u) => {
      e.icon != null && u(l);
    });
  }
  Lr(n), Zn(
    (u) => {
      Ae(n, "title", e.title), a = qt(n, "", a, u);
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
cg(["click"]);
var r9 = /* @__PURE__ */ Po('<div><div> </div> <svg height="6px"><line shape-rendering="crispEdges"></line><line shape-rendering="crispEdges"></line><line shape-rendering="crispEdges"></line></svg></div>');
function n9(t, e) {
  function r(g, m) {
    let y = Math.log10(m * g), w = Math.round(y), x = [0.1, 0.2, 0.5, 1, 2, 5, 10], _ = 0, S = 1e10;
    for (let k of x) {
      let T = Math.abs(Math.log10(k) + w - y);
      T < S && (_ = k, S = T);
    }
    return _ * Math.pow(10, w);
  }
  let n = /* @__PURE__ */ Ge(() => r(e.distancePerPoint, 30)), a = /* @__PURE__ */ Ge(() => O(n) / e.distancePerPoint);
  var o = r9();
  qt(o, "", {}, { display: "flex", "align-items": "center" });
  var l = Gr(o);
  qt(l, "", {}, { "padding-right": "4px" });
  var u = Gr(l, !0);
  Lr(l);
  var c = mr(l, 2), f = Gr(c);
  Ae(f, "x1", 1), Ae(f, "y1", 3), Ae(f, "y2", 3), qt(f, "", {}, {
    stroke: "currentColor",
    "stroke-width": "2",
    "stroke-cap": "butt"
  });
  var h = mr(f);
  Ae(h, "x1", 1), Ae(h, "x2", 1), Ae(h, "y1", 0), Ae(h, "y2", 6), qt(h, "", {}, { stroke: "currentColor" });
  var d = mr(h);
  Ae(d, "y1", 0), Ae(d, "y2", 6), qt(d, "", {}, { stroke: "currentColor" }), Lr(c), Lr(o), Zn(
    (g) => {
      Au(u, g), Ae(c, "width", `${O(a) + 2}px`), Ae(f, "x2", O(a) + 1), Ae(d, "x1", O(a) + 1), Ae(d, "x2", O(a) + 1);
    },
    [() => O(n).toLocaleString()]
  ), kr(t, o);
}
var i9 = /* @__PURE__ */ Po("<div> </div>"), a9 = /* @__PURE__ */ Po('<a target="_blank"> </a> <div style="border-right: 1px solid currentColor; margin: 4px 2px; opacity: 0.3; width: 0; height: 10px"></div>', 1), o9 = /* @__PURE__ */ Po('<div><div><!></div> <div></div> <div><!> <!> <!> <div style="border-right: 1px solid currentColor; margin: 4px 2px; opacity: 0.3; width: 0; height: 10px"></div> <!> <div style="border-right: 1px solid currentColor; margin: 4px 2px; opacity: 0.3; width: 0; height: 10px"></div> <span> </span></div></div>');
function l9(t, e) {
  Dl(e, !0);
  let r = Ye(e, "statusMessage", 3, null);
  var n = o9();
  let a;
  var o = Gr(n);
  let l;
  var u = Gr(o);
  {
    var c = (k) => {
      var T = i9();
      qt(T, "", {}, { display: "inline-block" });
      var E = Gr(T, !0);
      Lr(T), Zn(() => Au(E, r())), kr(k, T);
    };
    Mn(u, (k) => {
      r() != null && k(c);
    });
  }
  Lr(o);
  var f = mr(o, 2);
  qt(f, "", {}, { flex: "1 1 0%" });
  var h = mr(f, 2);
  let d;
  var g = Gr(h);
  {
    var m = (k) => {
      var T = a9(), E = gs(T);
      qt(E, "", {}, { color: "currentColor", "text-decoration": "underline" });
      var M = Gr(E, !0);
      Lr(E), eR(2), Zn(() => {
        Ae(E, "href", e.resolvedTheme.brandingLink.href), Au(M, e.resolvedTheme.brandingLink.text);
      }), kr(k, T);
    };
    Mn(g, (k) => {
      e.resolvedTheme.brandingLink != null && k(m);
    });
  }
  var y = mr(g, 2);
  {
    let k = /* @__PURE__ */ Ge(() => e.selectionMode == "marquee");
    ib(y, {
      icon: "marquee",
      get active() {
        return O(k);
      },
      title: "Toggle rectangle selection mode. In normal mode, use shift + drag for rectangle selection.",
      onClick: () => e.onSelectionMode(e.selectionMode == "marquee" ? "none" : "marquee")
    });
  }
  var w = mr(y, 2);
  {
    let k = /* @__PURE__ */ Ge(() => e.selectionMode == "lasso");
    ib(w, {
      icon: "lasso",
      get active() {
        return O(k);
      },
      title: "Toggle lasso selection mode. In normal mode, use shift + meta + drag for lasso selection.",
      onClick: () => e.onSelectionMode(e.selectionMode == "lasso" ? "none" : "lasso")
    });
  }
  var x = mr(w, 4);
  n9(x, {
    get distancePerPoint() {
      return e.distancePerPoint;
    }
  });
  var _ = mr(x, 4), S = Gr(_);
  Lr(_), Lr(h), Lr(n), Zn(
    (k, T, E, M) => {
      a = qt(n, "", a, k), l = qt(o, "", l, T), d = qt(h, "", d, E), Au(S, `${M ?? ""} points`);
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
function s9(t) {
  return (e, r) => {
    let n = new t(e, r);
    return {
      ...n.update ? { update: n.update.bind(n) } : {},
      ...n.destroy ? { destroy: n.destroy.bind(n) } : {}
    };
  };
}
let A0 = /* @__PURE__ */ new WeakMap();
function e_(t) {
  let e = typeof t == "function" ? t : t.class;
  if (A0.has(e))
    return A0.get(e);
  {
    let r = s9(e);
    return A0.set(e, r), r;
  }
}
function t_(t, e) {
  return typeof t == "function" ? e : { ...t.props ?? {}, ...e };
}
var u9 = /* @__PURE__ */ Po("<div><div></div></div>");
function c9(t, e) {
  Dl(e, !0);
  let r = Ye(e, "margin", 3, 4), n, a, o = /* @__PURE__ */ Ge(() => e_(e.customTooltip)), l = /* @__PURE__ */ Ge(() => t_(e.customTooltip, { tooltip: e.tooltip }));
  fg(() => {
    ud(() => {
      let f = O(o), h = null;
      return ud(() => {
        a.style.left = "0px", a.style.top = "0px", a.style.pointerEvents = e.allowInteraction ? "all" : "none", h == null ? h = f(a, O(l)) : h.update?.(O(l));
        function d(x, _, S, k) {
          let T = e.location.x, E = e.location.y, M = 2, R = x / 2, z = _ + (e.targetHeight + r());
          T - R < S && (R = T - S), T - R > k - x && (R = T - k + x), E - z < M && (z = -(e.targetHeight + r())), a.style.left = T - R + "px", a.style.top = E - z + "px";
        }
        let g = n.getBoundingClientRect(), { width: m, height: y } = a.getBoundingClientRect();
        d(m, y, 2, g.width - 2);
        let w = requestAnimationFrame(() => {
          w = null;
          let x = a.getBoundingClientRect();
          (x.width != m || x.height != y) && d(x.width, x.height, 2, g.width - 2);
        });
        return () => {
          w != null && cancelAnimationFrame(w);
        };
      }), () => {
        h?.destroy?.(), a.replaceChildren();
      };
    });
  });
  var u = u9();
  qt(u, "", {}, { position: "absolute", width: "100%" });
  var c = Gr(u);
  qt(c, "", {}, {
    display: "flex",
    position: "absolute",
    width: "fit-content",
    height: "fit-content",
    "z-index": "100"
  }), Iv(c, (f) => a = f, () => a), Lr(u), Iv(u, (f) => n = f, () => n), kr(t, u), Ol();
}
function dg(t, e, r) {
  t.prototype = e.prototype = r, r.constructor = t;
}
function r_(t, e) {
  var r = Object.create(t.prototype);
  for (var n in e) r[n] = e[n];
  return r;
}
function _c() {
}
var ec = 0.7, cd = 1 / ec, Cs = "\\s*([+-]?\\d+)\\s*", tc = "\\s*([+-]?(?:\\d*\\.)?\\d+(?:[eE][+-]?\\d+)?)\\s*", aa = "\\s*([+-]?(?:\\d*\\.)?\\d+(?:[eE][+-]?\\d+)?)%\\s*", f9 = /^#([0-9a-f]{3,8})$/, d9 = new RegExp(`^rgb\\(${Cs},${Cs},${Cs}\\)$`), h9 = new RegExp(`^rgb\\(${aa},${aa},${aa}\\)$`), v9 = new RegExp(`^rgba\\(${Cs},${Cs},${Cs},${tc}\\)$`), p9 = new RegExp(`^rgba\\(${aa},${aa},${aa},${tc}\\)$`), g9 = new RegExp(`^hsl\\(${tc},${aa},${aa}\\)$`), m9 = new RegExp(`^hsla\\(${tc},${aa},${aa},${tc}\\)$`), ab = {
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
dg(_c, hg, {
  copy(t) {
    return Object.assign(new this.constructor(), this, t);
  },
  displayable() {
    return this.rgb().displayable();
  },
  hex: ob,
  // Deprecated! Use color.formatHex.
  formatHex: ob,
  formatHex8: y9,
  formatHsl: b9,
  formatRgb: lb,
  toString: lb
});
function ob() {
  return this.rgb().formatHex();
}
function y9() {
  return this.rgb().formatHex8();
}
function b9() {
  return i_(this).formatHsl();
}
function lb() {
  return this.rgb().formatRgb();
}
function hg(t) {
  var e, r;
  return t = (t + "").trim().toLowerCase(), (e = f9.exec(t)) ? (r = e[1].length, e = parseInt(e[1], 16), r === 6 ? sb(e) : r === 3 ? new zn(e >> 8 & 15 | e >> 4 & 240, e >> 4 & 15 | e & 240, (e & 15) << 4 | e & 15, 1) : r === 8 ? _f(e >> 24 & 255, e >> 16 & 255, e >> 8 & 255, (e & 255) / 255) : r === 4 ? _f(e >> 12 & 15 | e >> 8 & 240, e >> 8 & 15 | e >> 4 & 240, e >> 4 & 15 | e & 240, ((e & 15) << 4 | e & 15) / 255) : null) : (e = d9.exec(t)) ? new zn(e[1], e[2], e[3], 1) : (e = h9.exec(t)) ? new zn(e[1] * 255 / 100, e[2] * 255 / 100, e[3] * 255 / 100, 1) : (e = v9.exec(t)) ? _f(e[1], e[2], e[3], e[4]) : (e = p9.exec(t)) ? _f(e[1] * 255 / 100, e[2] * 255 / 100, e[3] * 255 / 100, e[4]) : (e = g9.exec(t)) ? fb(e[1], e[2] / 100, e[3] / 100, 1) : (e = m9.exec(t)) ? fb(e[1], e[2] / 100, e[3] / 100, e[4]) : ab.hasOwnProperty(t) ? sb(ab[t]) : t === "transparent" ? new zn(NaN, NaN, NaN, 0) : null;
}
function sb(t) {
  return new zn(t >> 16 & 255, t >> 8 & 255, t & 255, 1);
}
function _f(t, e, r, n) {
  return n <= 0 && (t = e = r = NaN), new zn(t, e, r, n);
}
function x9(t) {
  return t instanceof _c || (t = hg(t)), t ? (t = t.rgb(), new zn(t.r, t.g, t.b, t.opacity)) : new zn();
}
function n_(t, e, r, n) {
  return arguments.length === 1 ? x9(t) : new zn(t, e, r, n ?? 1);
}
function zn(t, e, r, n) {
  this.r = +t, this.g = +e, this.b = +r, this.opacity = +n;
}
dg(zn, n_, r_(_c, {
  brighter(t) {
    return t = t == null ? cd : Math.pow(cd, t), new zn(this.r * t, this.g * t, this.b * t, this.opacity);
  },
  darker(t) {
    return t = t == null ? ec : Math.pow(ec, t), new zn(this.r * t, this.g * t, this.b * t, this.opacity);
  },
  rgb() {
    return this;
  },
  clamp() {
    return new zn(cl(this.r), cl(this.g), cl(this.b), fd(this.opacity));
  },
  displayable() {
    return -0.5 <= this.r && this.r < 255.5 && -0.5 <= this.g && this.g < 255.5 && -0.5 <= this.b && this.b < 255.5 && 0 <= this.opacity && this.opacity <= 1;
  },
  hex: ub,
  // Deprecated! Use color.formatHex.
  formatHex: ub,
  formatHex8: w9,
  formatRgb: cb,
  toString: cb
}));
function ub() {
  return `#${el(this.r)}${el(this.g)}${el(this.b)}`;
}
function w9() {
  return `#${el(this.r)}${el(this.g)}${el(this.b)}${el((isNaN(this.opacity) ? 1 : this.opacity) * 255)}`;
}
function cb() {
  const t = fd(this.opacity);
  return `${t === 1 ? "rgb(" : "rgba("}${cl(this.r)}, ${cl(this.g)}, ${cl(this.b)}${t === 1 ? ")" : `, ${t})`}`;
}
function fd(t) {
  return isNaN(t) ? 1 : Math.max(0, Math.min(1, t));
}
function cl(t) {
  return Math.max(0, Math.min(255, Math.round(t) || 0));
}
function el(t) {
  return t = cl(t), (t < 16 ? "0" : "") + t.toString(16);
}
function fb(t, e, r, n) {
  return n <= 0 ? t = e = r = NaN : r <= 0 || r >= 1 ? t = e = NaN : e <= 0 && (t = NaN), new Di(t, e, r, n);
}
function i_(t) {
  if (t instanceof Di) return new Di(t.h, t.s, t.l, t.opacity);
  if (t instanceof _c || (t = hg(t)), !t) return new Di();
  if (t instanceof Di) return t;
  t = t.rgb();
  var e = t.r / 255, r = t.g / 255, n = t.b / 255, a = Math.min(e, r, n), o = Math.max(e, r, n), l = NaN, u = o - a, c = (o + a) / 2;
  return u ? (e === o ? l = (r - n) / u + (r < n) * 6 : r === o ? l = (n - e) / u + 2 : l = (e - r) / u + 4, u /= c < 0.5 ? o + a : 2 - o - a, l *= 60) : u = c > 0 && c < 1 ? 0 : l, new Di(l, u, c, t.opacity);
}
function _9(t, e, r, n) {
  return arguments.length === 1 ? i_(t) : new Di(t, e, r, n ?? 1);
}
function Di(t, e, r, n) {
  this.h = +t, this.s = +e, this.l = +r, this.opacity = +n;
}
dg(Di, _9, r_(_c, {
  brighter(t) {
    return t = t == null ? cd : Math.pow(cd, t), new Di(this.h, this.s, this.l * t, this.opacity);
  },
  darker(t) {
    return t = t == null ? ec : Math.pow(ec, t), new Di(this.h, this.s, this.l * t, this.opacity);
  },
  rgb() {
    var t = this.h % 360 + (this.h < 0) * 360, e = isNaN(t) || isNaN(this.s) ? 0 : this.s, r = this.l, n = r + (r < 0.5 ? r : 1 - r) * e, a = 2 * r - n;
    return new zn(
      q0(t >= 240 ? t - 240 : t + 120, a, n),
      q0(t, a, n),
      q0(t < 120 ? t + 240 : t - 120, a, n),
      this.opacity
    );
  },
  clamp() {
    return new Di(db(this.h), kf(this.s), kf(this.l), fd(this.opacity));
  },
  displayable() {
    return (0 <= this.s && this.s <= 1 || isNaN(this.s)) && 0 <= this.l && this.l <= 1 && 0 <= this.opacity && this.opacity <= 1;
  },
  formatHsl() {
    const t = fd(this.opacity);
    return `${t === 1 ? "hsl(" : "hsla("}${db(this.h)}, ${kf(this.s) * 100}%, ${kf(this.l) * 100}%${t === 1 ? ")" : `, ${t})`}`;
  }
}));
function db(t) {
  return t = (t || 0) % 360, t < 0 ? t + 360 : t;
}
function kf(t) {
  return Math.max(0, Math.min(1, t || 0));
}
function q0(t, e, r) {
  return (t < 60 ? e + (r - e) * t / 60 : t < 180 ? r : t < 240 ? e + (r - e) * (240 - t) / 60 : e) * 255;
}
const hb = [
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
function Vs(t) {
  if (t < 1 && (t = 1), t <= hb.length)
    return hb.slice(0, t);
  if (t <= Sf.length)
    return Sf.slice(0, t);
  {
    let e = [];
    for (let r = 0; r < t; r++)
      e[r] = Sf[r % Sf.length];
    return e;
  }
}
function vg(t) {
  let { r: e, g: r, b: n, opacity: a } = n_(t);
  return { r: e / 255, g: r / 255, b: n / 255, a };
}
let ku;
function k9() {
  return ku == null && (ku = document.createElement("canvas"), ku.width = 1, ku.height = 1), ku.getContext("2d");
}
function S9(t) {
  let e = k9();
  e.font = `${t.fontSize ?? 10}px ${t.fontFamily ?? "system-ui"}`;
  let r = t.text.split(`
`).map((a) => e.measureText(a).width), n = (t.fontSize ?? 10) * (t.lineSpacing ?? 1) * r.length;
  return {
    width: r.reduce((a, o) => Math.max(a, o)),
    height: n
  };
}
function a_() {
  return [1, 0, 0, 0, 1, 0, 0, 0, 1];
}
function pg(t, e) {
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
function o_(t, e) {
  return [
    e[0] * t[0] + e[3] * t[1] + e[6] * t[2],
    e[1] * t[0] + e[4] * t[1] + e[7] * t[2],
    e[2] * t[0] + e[5] * t[1] + e[8] * t[2]
  ];
}
function C9(t) {
  return t[0] * t[4] * t[8] - t[0] * t[5] * t[7] - t[1] * t[3] * t[8] + t[1] * t[5] * t[6] + t[2] * t[3] * t[7] - t[2] * t[4] * t[6];
}
function l_(t) {
  let e = C9(t);
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
class dd {
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
    let { x: e, y: r, scale: n } = this.viewport, a = n, o = n;
    this.width < this.height ? a *= this.height / this.width : o *= this.width / this.height, this._matrix = [a, 0, 0, 0, o, 0, -e * a, -r * o, 1], this._pixel_kx = this._matrix[0] * this.width / 2, this._pixel_bx = (this._matrix[6] + 1) * this.width / 2, this._pixel_ky = -this._matrix[4] * this.height / 2, this._pixel_by = (-this._matrix[7] + 1) * this.height / 2;
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
    let e = this._pixel_kx, r = this._pixel_ky, n = this._pixel_bx, a = this._pixel_by;
    return (o, l) => ({ x: o * e + n, y: l * r + a });
  }
  coordinateAtPixelFunction() {
    let e = this._pixel_kx, r = this._pixel_ky, n = this._pixel_bx, a = this._pixel_by;
    return (o, l) => ({ x: (o - n) / e, y: (l - a) / r });
  }
}
class Hv {
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
let Xs = class extends Hv {
  _value = null;
  setValue(t) {
    this._value !== t && (this._value = t, this.setNeedsRunDownstream());
  }
  get value() {
    return this.run(), this._value;
  }
};
class s_ extends Xs {
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
class E9 extends Xs {
  fn;
  constructor(e, r) {
    super(r), this.fn = e;
  }
  update() {
    this.setValue(this.fn());
  }
}
class M9 extends Xs {
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
class R9 extends Xs {
  parent;
  condition;
  buildTrue;
  buildFalse;
  context = null;
  currentCondition = null;
  currentNode = null;
  constructor(e, r, n, a) {
    super([r]), this.parent = e, this.condition = r, this.buildTrue = n, this.buildFalse = a;
  }
  update() {
    (this.currentNode == null || this.currentCondition !== this.condition.value) && (this.currentNode && this.removeInput(this.currentNode), this.context?.destroy(), this.context = new Bl(this.parent), this.currentCondition = this.condition.value, this.currentCondition ? this.currentNode = this.buildTrue(this.context) : this.currentNode = this.buildFalse(this.context), this.addInput(this.currentNode)), this.setValue(this.currentNode.value);
  }
  destroy() {
    super.destroy(), this.context?.destroy();
  }
}
class T9 extends Xs {
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
        let a = this.cache.get(n);
        return a.input.value = n, a.output.value;
      } else {
        let a = new Bl(this.parent), o = new s_(n), l = this.build(a, o);
        return this.cache.set(n, { context: a, input: o, output: l }), this.addInput(l), l.value;
      }
    });
    for (let [n, a] of this.cache)
      e.has(n) || (this.cache.delete(n), this.removeInput(a.output), a.context.destroy());
    this.setValue(r);
  }
  destroy() {
    super.destroy();
    for (let e of this.cache.values())
      e.context.destroy();
  }
}
class N9 extends Xs {
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
    (this.currentNode == null || this.input.value !== this.currentCase) && (this.currentNode && this.removeInput(this.currentNode), this.currentContext?.destroy(), this.currentContext = new Bl(this.parent), this.currentCase = this.input.value, this.currentNode = this.cases[this.currentCase](this.currentContext), this.addInput(this.currentNode)), this.setValue(this.currentNode.value);
  }
  destroy() {
    super.destroy(), this.currentContext?.destroy();
  }
}
class Bl {
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
    let r = new s_(e);
    return this._nodes.add(r), r;
  }
  /** Creates a derived value. */
  derive(e, r) {
    let n = e.map((o) => o instanceof Hv ? o : this.value(o)), a = new E9(() => r(...n.map((o) => o.value)), n);
    return this._nodes.add(a), a;
  }
  /** Creates a stateful derived value. */
  statefulDerive(e, r) {
    let n = e.map((o) => o instanceof Hv ? o : this.value(o)), a = new M9((o) => r(o, ...n.map((l) => l.value)), n);
    return this._nodes.add(a), a;
  }
  /** Creates a true or false dataflow depending on the value of the condition. */
  if(e, r, n) {
    let a = new R9(this, e, r, n);
    return this._nodes.add(a), a;
  }
  switch(e, r) {
    let n = new N9(this, e, r);
    return this._nodes.add(n), n;
  }
  map(e, r) {
    let n = new T9(this, e, r);
    return this._nodes.add(n), n;
  }
  assertNotNull(e) {
    return e;
  }
  subgraph() {
    return new Bl(this);
  }
}
function fa(t, e, r, n) {
  if (t.program == null || t.vsSource != r || t.fsSource != n) {
    t.destroy && t.destroy();
    let o = vb(e, e.VERTEX_SHADER, r), l = vb(e, e.FRAGMENT_SHADER, n), u = e.createProgram();
    if (e.attachShader(u, o), e.attachShader(u, l), e.linkProgram(u), !e.getProgramParameter(u, e.LINK_STATUS)) {
      var a = e.getProgramInfoLog(u);
      throw new Error(`failed to link program: ${a}, vertex source: ${r}, fragment source: ${n}`);
    }
    t.program = u, t.vsSource = r, t.fsSource = n, t.destroy = () => {
      e.deleteProgram(u), e.deleteShader(o), e.deleteShader(l);
    }, t.uniforms = {};
    for (let c of (r + n).matchAll(/uniform +[0-9a-zA-Z_]+ +([0-9a-zA-Z_]+) *(;|\[)/g)) {
      let f = c[1];
      t.uniforms[f] = e.getUniformLocation(u, f);
    }
  }
  return { program: t.program, uniforms: t.uniforms ?? {} };
}
function vb(t, e, r) {
  let n = t.createShader(e);
  if (t.shaderSource(n, r), t.compileShader(n), !t.getShaderParameter(n, t.COMPILE_STATUS)) {
    var a = t.getShaderInfoLog(n);
    throw new Error(`failed to compile shader: ${a}, source: ${r}`);
  }
  return n;
}
function oa(t, e, r, n) {
  if (t.buffer == null) {
    let a = e.createBuffer();
    t.buffer = a, t.destroy = () => {
      e.deleteBuffer(a);
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
function F9(t, e, r, n, a) {
  const o = {
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
  let [l, u, c] = o[a][n];
  t.texImage2D(t.TEXTURE_2D, 0, l, e, r, 0, u, c, null), t.texParameteri(t.TEXTURE_2D, t.TEXTURE_MIN_FILTER, t.LINEAR), t.texParameteri(t.TEXTURE_2D, t.TEXTURE_MAG_FILTER, t.LINEAR), t.texParameteri(t.TEXTURE_2D, t.TEXTURE_WRAP_S, t.CLAMP_TO_EDGE), t.texParameteri(t.TEXTURE_2D, t.TEXTURE_WRAP_T, t.CLAMP_TO_EDGE);
}
function po(t, e, r, n, a, o) {
  if (t.framebuffer == null || t.texture == null) {
    let u = e.createFramebuffer(), c = e.createTexture();
    e.bindFramebuffer(e.FRAMEBUFFER, u), e.bindTexture(e.TEXTURE_2D, c), e.framebufferTexture2D(e.FRAMEBUFFER, e.COLOR_ATTACHMENT0, e.TEXTURE_2D, c, 0), e.bindTexture(e.TEXTURE_2D, null), e.bindFramebuffer(e.FRAMEBUFFER, null), t.framebuffer = u, t.texture = c, t.destroy = () => {
      e.deleteFramebuffer(u), e.deleteTexture(c);
    };
  }
  let l = `${r},${n},${a},${o}`;
  return t.cacheKey != l && (t.cacheKey = l, e.bindTexture(e.TEXTURE_2D, t.texture), F9(e, r, n, a, o), e.bindTexture(e.TEXTURE_2D, null)), {
    framebuffer: t.framebuffer,
    texture: t.texture,
    width: r,
    height: n
  };
}
function P9(t) {
  let e = t.squareMaxSize, r = t.samples, n = `#version 300 es
    precision highp float;
    layout(location=0) in vec2 xy;
    out vec2 uv;
    void main() {
      gl_Position = vec4(xy, 0, 1);
      uv = (xy + 1.0) / 2.0;
    }
  `, a = `#version 300 es
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
  `, o = `#version 300 es
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
  return { vertex: n, fragment1: a, fragment2: o };
}
function z9(t, e, r) {
  let n = t.derive([r], D9), a = t.derive([n], P9), o = t.statefulDerive(
    [e, t.derive([a], (c) => c.vertex), t.derive([a], (c) => c.fragment1)],
    fa
  ), l = t.statefulDerive(
    [e, t.derive([a], (c) => c.vertex), t.derive([a], (c) => c.fragment2)],
    fa
  ), u = t.statefulDerive([e, [-1, -1, -1, 1, 1, -1, 1, 1], "f32"], oa);
  return t.derive(
    [e, u, o, l, r, n],
    (c, f, h, d, g, m) => (y, w, x) => {
      let { width: _, height: S } = w;
      c.disable(c.BLEND), c.enableVertexAttribArray(0), c.bindBuffer(c.ARRAY_BUFFER, f), c.vertexAttribPointer(0, 2, c.FLOAT, !1, 0, 0), c.bindBuffer(c.ARRAY_BUFFER, null), c.useProgram(h.program), c.uniform2f(h.uniforms.resolution, _, S), c.uniform1i(h.uniforms.image, 0), c.bindFramebuffer(c.FRAMEBUFFER, w.framebuffer), c.bindTexture(c.TEXTURE_2D, y), c.uniform2f(h.uniforms.direction, 0, 1), c.drawArrays(c.TRIANGLE_STRIP, 0, 4), c.bindFramebuffer(c.FRAMEBUFFER, x.framebuffer), c.bindTexture(c.TEXTURE_2D, w.texture), c.uniform2f(h.uniforms.direction, 1, 0), c.drawArrays(c.TRIANGLE_STRIP, 0, 4), c.bindFramebuffer(c.FRAMEBUFFER, w.framebuffer), c.activeTexture(c.TEXTURE1), c.bindTexture(c.TEXTURE_2D, x.texture), c.activeTexture(c.TEXTURE0), c.bindTexture(c.TEXTURE_2D, y), c.useProgram(d.program), c.uniform2f(d.uniforms.resolution, _, S), c.uniform1i(d.uniforms.image, 0), c.uniform1i(d.uniforms.imageBox, 1);
      let k = 1 / m.totalWeight * g * g * Math.PI;
      c.uniform1f(d.uniforms.scaler, k), c.drawArrays(c.TRIANGLE_STRIP, 0, 4), c.bindFramebuffer(c.FRAMEBUFFER, null), c.useProgram(null), c.activeTexture(c.TEXTURE1), c.bindTexture(c.TEXTURE_2D, null), c.activeTexture(c.TEXTURE0), c.bindTexture(c.TEXTURE_2D, null), c.disableVertexAttribArray(0);
    }
  );
}
function pb(t, e, r) {
  let n = Math.sqrt(e * e + r * r);
  if (n < t - Math.sqrt(2) / 2)
    return 1;
  if (n > t + Math.sqrt(2) / 2)
    return 0;
  let a = 2, o = 0;
  for (let l = 0; l < a; l++)
    for (let u = 0; u < a; u++) {
      let c = e + (l + 0.5) / a - 0.5, f = r + (u + 0.5) / a - 0.5;
      Math.sqrt(c * c + f * f) < t && (o += 1);
    }
  return o / a / a;
}
function D9(t) {
  let e = Math.floor(t + 0.5), r = e, n = pb(t, 0, 0), a = [];
  for (let u = -e; u <= e; u++)
    for (let c = -e; c <= e; c++) {
      let f = n - pb(t, u, c);
      if (!(f <= 0))
        if (a.length > 0 && u == a[a.length - 1].x && c == a[a.length - 1].y + 1) {
          let h = a[a.length - 1].w, d = f;
          a[a.length - 1].y += 1 - h / (h + d), a[a.length - 1].w = h + d;
        } else
          a.push({ x: u, y: c, w: f });
    }
  a = a.sort((u, c) => u.y != c.y ? u.y - c.y : u.x - c.x);
  let o = [];
  for (let { x: u, y: c, w: f } of a)
    if (o.length > 0 && c == o[o.length - 1].y && u == o[o.length - 1].x + 1) {
      let h = o[o.length - 1].w, d = f;
      o[o.length - 1].x += 1 - h / (h + d), o[o.length - 1].w = h + d;
    } else
      o.push({ x: u, y: c, w: f });
  let l = -o.reduce((u, c) => u + c.w, 0);
  return l += n * (1 + r * 2) * (1 + r * 2), { squareMaxSize: r, squareWeight: n, samples: o, totalWeight: l };
}
function O9(t) {
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
function Wv(t, e, r, n, a, o) {
  let l = a != null, u = O9(l), c = t.statefulDerive([e, u.vertex, u.fragment], fa);
  return t.derive([e, c, r, n, a, o], (f, h, d, g, m, y) => (w) => {
    f.enable(f.BLEND), f.blendFunc(f.ONE, f.ONE), f.useProgram(h.program), f.enableVertexAttribArray(0), f.bindBuffer(f.ARRAY_BUFFER, d), f.vertexAttribPointer(0, 1, f.FLOAT, !1, 0, 0), f.enableVertexAttribArray(1), f.bindBuffer(f.ARRAY_BUFFER, g), f.vertexAttribPointer(1, 1, f.FLOAT, !1, 0, 0), m != null && (f.enableVertexAttribArray(2), f.bindBuffer(f.ARRAY_BUFFER, m), f.vertexAttribIPointer(2, 1, f.BYTE, 0, 0)), f.bindBuffer(f.ARRAY_BUFFER, null), f.uniformMatrix3fv(h.uniforms.matrix, !1, w), f.drawArrays(f.POINTS, 0, y), f.disableVertexAttribArray(0), f.disableVertexAttribArray(1), m != null && f.disableVertexAttribArray(2), f.useProgram(null);
  });
}
function L9() {
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
function u_(t, e) {
  let { vertex: r, fragment: n } = L9(), a = t.statefulDerive([e, r, n], fa), o = t.statefulDerive([e, [-1, -1, -1, 1, 1, -1, 1, 1], "f32"], oa);
  return t.derive([e, a, o], (l, u, c) => (f, h, d, g) => {
    l.disable(l.BLEND), l.enableVertexAttribArray(0), l.bindBuffer(l.ARRAY_BUFFER, c), l.vertexAttribPointer(0, 2, l.FLOAT, !1, 0, 0), l.bindBuffer(l.ARRAY_BUFFER, null), l.bindTexture(l.TEXTURE_2D, f), l.useProgram(u.program), l.uniform1i(u.uniforms.source, 0), l.uniform2f(u.uniforms.xyScaler, d ?? 1, g ?? 1), l.uniform1f(u.uniforms.gamma, h ?? 2.2), l.drawArrays(l.TRIANGLE_STRIP, 0, 4), l.useProgram(null), l.bindTexture(l.TEXTURE_2D, null), l.disableVertexAttribArray(0);
  });
}
function c_(t) {
  return Math.ceil(t * 3);
}
function B9(t) {
  let e = c_(t), r = [];
  for (let u = -e; u <= e; u++)
    r.push(Math.exp(-u * u / t / t / 2));
  let n = r.reduce((u, c) => u + c, 0);
  r = r.map((u) => u / n);
  let a = q9(r).map(([u, c]) => [u - e, c]), o = `#version 300 es
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
      ${a.map(([u, c]) => `color += texture(image, uv + direction * vec2(${u.toFixed(10)}) / resolution) * ${c.toFixed(10)};`).join(`
`)}
      outColor = color;
    }
  `;
  return { vertex: o, fragment: l };
}
function A9(t, e, r) {
  let n = t.derive([r], B9), a = t.statefulDerive(
    [e, t.derive([n], (l) => l.vertex), t.derive([n], (l) => l.fragment)],
    fa
  ), o = t.statefulDerive([e, [-1, -1, -1, 1, 1, -1, 1, 1], "f32"], oa);
  return t.derive([e, o, a, r], (l, u, c, f) => (h, d, g) => {
    let { width: m, height: y } = d;
    l.disable(l.BLEND), l.enableVertexAttribArray(0), l.bindBuffer(l.ARRAY_BUFFER, u), l.vertexAttribPointer(0, 2, l.FLOAT, !1, 0, 0), l.bindBuffer(l.ARRAY_BUFFER, null), l.useProgram(c.program), l.uniform2f(c.uniforms.resolution, m, y), l.uniform1i(c.uniforms.image, 0), l.bindFramebuffer(l.FRAMEBUFFER, g.framebuffer), l.bindTexture(l.TEXTURE_2D, h), l.uniform2f(c.uniforms.direction, 0, 1), l.drawArrays(l.TRIANGLE_STRIP, 0, 4), l.bindFramebuffer(l.FRAMEBUFFER, d.framebuffer), l.bindTexture(l.TEXTURE_2D, g.texture), l.uniform2f(c.uniforms.direction, 1, 0), l.drawArrays(l.TRIANGLE_STRIP, 0, 4), l.bindFramebuffer(l.FRAMEBUFFER, null), l.useProgram(null), l.bindTexture(l.TEXTURE_2D, null), l.disableVertexAttribArray(0);
  });
}
function q9(t) {
  let e = [];
  for (let r = 0; r < t.length; r += 2)
    if (r + 1 < t.length) {
      let n = t[r], a = t[r + 1], o = 1 - n / (n + a);
      if (o >= 0 && o <= 1) {
        let l = n + a;
        l != 0 && e.push([r + o, l]);
      } else
        e.push([r, t[r]]), e.push([r + 1, t[r + 1]]);
    } else
      e.push([r, t[r]]);
  return e;
}
function j9(t) {
  return Math.ceil(t * 3);
}
function $9() {
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
function U9(t, e, r) {
  let { vertex: n, fragment: a } = $9(), o = t.statefulDerive([e, n, a], fa), l = t.statefulDerive([e, [-1, -1, -1, 1, 1, -1, 1, 1], "f32"], oa);
  return t.derive([e, l, o], (u, c, f) => (h, d, g) => {
    let { width: m, height: y } = d;
    u.disable(u.BLEND), u.enableVertexAttribArray(0), u.bindBuffer(u.ARRAY_BUFFER, c), u.vertexAttribPointer(0, 2, u.FLOAT, !1, 0, 0), u.bindBuffer(u.ARRAY_BUFFER, null), u.useProgram(f.program), u.uniform2f(f.uniforms.resolution, m, y), u.uniform1i(f.uniforms.image, 0);
    let w = h, x = g, _ = d;
    for (let S = 0; S < 2; S++) {
      u.uniform2f(f.uniforms.direction, S, 1 - S);
      for (let [k, T, E] of I9) {
        u.bindFramebuffer(u.FRAMEBUFFER, x.framebuffer), u.bindTexture(u.TEXTURE_2D, w), u.uniform1fv(f.uniforms.weight0, T), u.uniform3fv(f.uniforms.distances, k), u.uniform3fv(f.uniforms.weights, E), u.drawArrays(u.TRIANGLE_STRIP, 0, 4), w = x.texture;
        let M = x;
        x = _, _ = M;
      }
    }
    u.bindFramebuffer(u.FRAMEBUFFER, null), u.useProgram(null), u.bindTexture(u.TEXTURE_2D, null), u.disableVertexAttribArray(0);
  });
}
const I9 = [
  [[1, 2, 3], [0.2288468365182578], [0.18230006506971572, 0.1356122230111784, 0.06766429365997693]],
  [[2, 6, 10], [0.09116254014100238], [0.23317759354726447, 0.18385867277788717, 0.03738246360434722]],
  [[3, 10, 20], [0.2950645715317288], [0.010918865853671198, 0.23773695670296047, 0.10381189167750389]],
  [[4, 16, 30], [0.20085957073474772], [0.14463019087130788, 0.17934533765938643, 0.07559468610193185]]
];
function H9() {
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
function W9(t, e) {
  let { vertex: r, fragment: n } = H9(), a = t.statefulDerive([e, r, n], fa), o = t.statefulDerive([e, [-1, -1, -1, 1, 1, -1, 1, 1], "f32"], oa);
  return t.derive(
    [e, a, o],
    (l, u, c) => (f, h, d, g, m, y) => {
      l.enable(l.BLEND), l.blendFunc(l.ONE, l.ONE_MINUS_SRC_ALPHA), l.enableVertexAttribArray(0), l.bindBuffer(l.ARRAY_BUFFER, c), l.vertexAttribPointer(0, 2, l.FLOAT, !1, 0, 0), l.bindBuffer(l.ARRAY_BUFFER, null), l.bindTexture(l.TEXTURE_2D, f.texture), l.useProgram(u.program), l.uniform1i(u.uniforms.source, 0), l.uniform2f(u.uniforms.resolution, f.width, f.height), l.uniform1f(u.uniforms.densityScaler, h), l.uniform1f(u.uniforms.quantizationStep, d), l.uniform1f(u.uniforms.globalAlpha, g), l.uniform4fv(u.uniforms.channelMask, m), l.uniform4fv(u.uniforms.color, y), l.drawArrays(l.TRIANGLE_STRIP, 0, 4), l.useProgram(null), l.bindTexture(l.TEXTURE_2D, null), l.disableVertexAttribArray(0);
    }
  );
}
function G9() {
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
function V9(t, e) {
  let { vertex: r, fragment: n } = G9(), a = t.statefulDerive([e, r, n], fa), o = t.statefulDerive([e, [-1, -1, -1, 1, 1, -1, 1, 1], "f32"], oa);
  return t.derive(
    [e, a, o],
    (l, u, c) => (f, h, d, g, m, y) => {
      l.enable(l.BLEND), l.blendFunc(l.ONE, l.ONE_MINUS_SRC_ALPHA), l.enableVertexAttribArray(0), l.bindBuffer(l.ARRAY_BUFFER, c), l.vertexAttribPointer(0, 2, l.FLOAT, !1, 0, 0), l.bindBuffer(l.ARRAY_BUFFER, null), l.bindTexture(l.TEXTURE_2D, f.texture), l.useProgram(u.program), l.uniform1i(u.uniforms.source, 0), l.uniform2f(u.uniforms.resolution, f.width, f.height), l.uniform1f(u.uniforms.densityScaler, h), l.uniform1f(u.uniforms.quantizationStep, d), l.uniform1f(u.uniforms.globalAlpha, g), l.uniform1i(u.uniforms.isDarkMode, y == "dark" ? 1 : 0), l.uniformMatrix4fv(u.uniforms.colorMatrix, !1, m), l.drawArrays(l.TRIANGLE_STRIP, 0, 4), l.useProgram(null), l.bindTexture(l.TEXTURE_2D, null), l.disableVertexAttribArray(0);
    }
  );
}
function X9(t) {
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
function gb(t, e, r, n, a, o) {
  let l = a != null, u = X9(l), c = t.statefulDerive([e, u.vertex, u.fragment], fa);
  return t.derive(
    [e, c, r, n, a, o],
    (f, h, d, g, m, y) => (w, x, _, S) => {
      f.enable(f.BLEND), f.blendFunc(f.ONE, f.ONE_MINUS_SRC_ALPHA), f.useProgram(h.program), f.enableVertexAttribArray(0), f.bindBuffer(f.ARRAY_BUFFER, d), f.vertexAttribPointer(0, 1, f.FLOAT, !1, 0, 0), f.enableVertexAttribArray(1), f.bindBuffer(f.ARRAY_BUFFER, g), f.vertexAttribPointer(1, 1, f.FLOAT, !1, 0, 0), m != null && (f.enableVertexAttribArray(2), f.bindBuffer(f.ARRAY_BUFFER, m), f.vertexAttribIPointer(2, 1, f.BYTE, 0, 0)), f.bindBuffer(f.ARRAY_BUFFER, null), f.uniformMatrix3fv(h.uniforms.matrix, !1, w), f.uniform1f(h.uniforms.point_size, x * 2), f.uniform1f(h.uniforms.alpha, _), l ? f.uniform4fv(h.uniforms.colorScheme, S) : f.uniform4fv(h.uniforms.colorScheme, S.slice(0, 4)), f.drawArrays(f.POINTS, 0, y), f.disableVertexAttribArray(0), f.disableVertexAttribArray(1), m != null && f.disableVertexAttribArray(2), f.useProgram(null);
    }
  );
}
function Y9() {
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
function Z9(t, e) {
  let { vertex: r, fragment: n } = Y9(), a = t.statefulDerive([e, r, n], fa), o = t.statefulDerive([e, [-1, -1, -1, 1, 1, -1, 1, 1], "f32"], oa);
  return t.derive(
    [e, a, o],
    (l, u, c) => (f, h, d, g, m) => {
      l.enable(l.BLEND), l.blendFunc(l.ONE, l.ONE_MINUS_SRC_ALPHA), l.enableVertexAttribArray(0), l.bindBuffer(l.ARRAY_BUFFER, c), l.vertexAttribPointer(0, 2, l.FLOAT, !1, 0, 0), l.bindBuffer(l.ARRAY_BUFFER, null), l.bindTexture(l.TEXTURE_2D, f.texture), l.useProgram(u.program), l.uniform1i(u.uniforms.source, 0), l.uniform2f(u.uniforms.resolution, f.width, f.height), l.uniform1f(u.uniforms.pointAlpha, h), l.uniform1f(u.uniforms.globalAlpha, d), l.uniform1i(u.uniforms.isDarkMode, m == "dark" ? 1 : 0), l.uniformMatrix4fv(u.uniforms.colorMatrix, !1, g), l.drawArrays(l.TRIANGLE_STRIP, 0, 4), l.useProgram(null), l.bindTexture(l.TEXTURE_2D, null), l.disableVertexAttribArray(0);
    }
  );
}
let K9 = class {
  props;
  viewport;
  df;
  gl;
  renderInputs;
  dataBuffers;
  renderer;
  constructor(e, r, n) {
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
      width: r,
      height: n
    }, this.viewport = new dd({ x: 0, y: 0, scale: 1 }, r, n);
    let a = new Bl(), o = a.value(e);
    this.df = a, this.gl = o, this.renderInputs = {
      mode: a.value(this.props.mode),
      colorScheme: a.value(this.props.colorScheme),
      xData: a.value(this.props.x),
      yData: a.value(this.props.y),
      categoryData: a.value(this.props.category),
      categoryCount: a.value(this.props.categoryCount),
      matrix: a.value(a_()),
      width: a.value(r),
      height: a.value(n),
      pointSize: a.value(this.props.pointSize),
      densityBandwidth: a.value(this.props.densityBandwidth)
    }, this.dataBuffers = J9(a, o, this.renderInputs), this.renderer = Q9(a, o, this.renderInputs, this.dataBuffers);
  }
  setProps(e) {
    let r = !1, n;
    for (n in e)
      e[n] !== this.props[n] && (this.props[n] = e[n], r = !0);
    return this.viewport.update(
      { x: this.props.viewportX, y: this.props.viewportY, scale: this.props.viewportScale },
      this.props.width,
      this.props.height
    ), this.renderInputs.mode.value = this.props.mode, this.renderInputs.colorScheme.value = this.props.colorScheme, this.renderInputs.xData.value = this.props.x, this.renderInputs.yData.value = this.props.y, this.renderInputs.categoryData.value = this.props.category, this.props.category != null ? this.renderInputs.categoryCount.value = this.props.categoryCount : this.renderInputs.categoryCount.value = 1, this.renderInputs.matrix.value = this.viewport.matrix(), this.renderInputs.width.value = this.props.width, this.renderInputs.height.value = this.props.height, this.renderInputs.pointSize.value = this.props.pointSize, this.renderInputs.densityBandwidth.value = this.props.densityBandwidth, r;
  }
  render() {
    this.renderer.value(this.props);
  }
  destroy() {
    this.df.destroy();
  }
  async densityMap(e, r, n, a) {
    let o = this.df.subgraph(), l = rT(o, this.gl, this.dataBuffers, o.value(e), o.value(r), o.value(n)), { x: u, y: c, scale: f } = a, h = [f, 0, 0, 0, f, 0, -u * f, -c * f, 1], d = l.value(h), g = l_(h);
    return o.destroy(), {
      data: d,
      width: e,
      height: r,
      coordinateAtPixel: (m, y) => {
        let w = m / e * 2 - 1, x = y / r * 2 - 1, _ = o_([w, x, 1], g);
        return { x: _[0], y: _[1] };
      }
    };
  }
};
function J9(t, e, r) {
  const n = t.statefulDerive([e, r.xData, "f32"], oa), a = t.statefulDerive([e, r.yData, "f32"], oa), o = t.if(
    t.derive([r.categoryData], (u) => u != null),
    (u) => u.statefulDerive([e, u.assertNotNull(r.categoryData), "u8"], oa),
    (u) => u.value(null)
  ), l = t.derive([r.xData], (u) => u.length);
  return { x: n, y: a, category: o, count: l };
}
function Q9(t, e, r, n) {
  return t.switch(r.mode, {
    points: (a) => eT(a, e, r, n),
    density: (a) => tT(a, e, r, n)
  });
}
function eT(t, e, r, n) {
  const a = t.derive([r.categoryCount], (c) => c > 1), o = t.statefulDerive([e, r.width, r.height, 4, "f32"], po);
  let l = t.if(
    a,
    (c) => gb(c, e, n.x, n.y, c.assertNotNull(n.category), n.count),
    (c) => gb(c, e, n.x, n.y, null, n.count)
  ), u = u_(t, e);
  return t.derive(
    [e, o, l, u, r.colorScheme, r.matrix, r.categoryCount],
    (c, f, h, d, g, m, y) => (w) => {
      let x = [], _ = w.categoryColors ?? Vs(w.categoryCount);
      for (let S = 0; S < y; S++)
        if (S < _.length) {
          let { r: k, g: T, b: E } = vg(_[S]);
          k = Math.pow(k, w.gamma), T = Math.pow(T, w.gamma), E = Math.pow(E, w.gamma), x = x.concat([k, T, E, 1]);
        } else
          x = x.concat([0.5, 0.5, 0.5, 1]);
      c.bindFramebuffer(c.FRAMEBUFFER, f.framebuffer), c.viewport(0, 0, f.width, f.height), g == "light" ? c.clearColor(1, 1, 1, 1) : c.clearColor(0, 0, 0, 1), c.clear(c.COLOR_BUFFER_BIT), h(m, Math.max(3, w.pointSize), w.pointAlpha * w.pointsAlpha, x), c.bindFramebuffer(c.FRAMEBUFFER, null), c.viewport(0, 0, w.width, w.height), d(f.texture, w.gamma);
    }
  );
}
function tT(t, e, r, n) {
  let a = t.derive([r.densityBandwidth], (k) => j9(k) + 1), o = t.derive([r.width, a], (k, T) => k + T * 2), l = t.derive([r.height, a], (k, T) => k + T * 2);
  const u = t.derive([r.categoryCount], (k) => k > 1), c = t.statefulDerive([e, o, l, 4, "f32"], po), f = t.statefulDerive([e, o, l, 4, "f32"], po), h = t.statefulDerive([e, o, l, 4, "f32"], po), d = t.statefulDerive([e, o, l, 4, "f32"], po);
  let g = t.if(
    u,
    (k) => Wv(k, e, n.x, n.y, k.assertNotNull(n.category), n.count),
    (k) => Wv(k, e, n.x, n.y, null, n.count)
  ), m = z9(t, e, r.pointSize), y = U9(t, e, r.densityBandwidth), w = Z9(t, e), x = V9(t, e), _ = W9(t, e), S = u_(t, e);
  return t.derive(
    [
      e,
      c,
      f,
      h,
      d,
      r.colorScheme,
      r.matrix,
      g,
      m,
      y,
      w,
      x,
      _,
      S
    ],
    (k, T, E, M, R, z, B, $, L, q, j, W, Y, G) => (X) => {
      let K = X.categoryColors ?? Vs(X.categoryCount), V = [];
      for (let se = 0; se < 4; se++)
        if (se < K.length) {
          let { r: ye, g: Se, b: xe } = vg(K[se]);
          ye = Math.pow(ye, X.gamma), Se = Math.pow(Se, X.gamma), xe = Math.pow(xe, X.gamma), V = V.concat([ye, Se, xe, 1]);
        } else
          V = V.concat([0.5, 0.5, 0.5, 1]);
      let U = X.width / E.width, Z = X.height / E.height, le = pg([U, 0, 0, 0, Z, 0, 0, 0, 1], B);
      if (k.bindFramebuffer(k.FRAMEBUFFER, T.framebuffer), k.viewport(0, 0, T.width, T.height), k.clearColor(0, 0, 0, 0), k.clear(k.COLOR_BUFFER_BIT), $(le), k.bindFramebuffer(k.FRAMEBUFFER, E.framebuffer), k.viewport(0, 0, E.width, E.height), z == "light" ? k.clearColor(1, 1, 1, 1) : k.clearColor(0, 0, 0, 1), k.clear(k.COLOR_BUFFER_BIT), X.pointAlpha > 0 && X.pointsAlpha > 0 && (L(T.texture, M, R), k.bindFramebuffer(k.FRAMEBUFFER, E.framebuffer), j(M, X.pointAlpha, X.pointsAlpha, V, z)), X.densityScaler > 0 && (X.densityAlpha > 0 || X.contoursAlpha > 0) && (q(T.texture, M, R), k.bindFramebuffer(k.FRAMEBUFFER, E.framebuffer), X.densityAlpha > 0 && W(
        M,
        X.densityScaler,
        X.densityQuantizationStep,
        X.densityAlpha,
        V,
        z
      ), X.contoursAlpha > 0))
        for (let se = 0; se < K.length; se++) {
          let ye = [0, 0, 0, 0];
          ye[se] = 1, Y(
            M,
            X.densityScaler,
            X.densityQuantizationStep,
            X.contoursAlpha,
            ye,
            V.slice(se * 4, se * 4 + 4)
          );
        }
      k.bindFramebuffer(k.FRAMEBUFFER, null), k.viewport(0, 0, X.width, X.height), G(E.texture, X.gamma, 1 / U, 1 / Z);
    }
  );
}
function rT(t, e, r, n, a, o) {
  let l = t.derive([o], (y) => c_(y) + 1), u = t.derive([n, l], (y, w) => y + w * 2), c = t.derive([a, l], (y, w) => y + w * 2);
  const f = t.statefulDerive([e, u, c, 1, "f32"], po), h = t.statefulDerive([e, u, c, 1, "f32"], po), d = t.statefulDerive([e, u, c, 1, "f32"], po);
  let g = Wv(t, e, r.x, r.y, null, r.count), m = A9(t, e, o);
  return t.derive(
    [e, l, n, a, f, h, d, g, m],
    (y, w, x, _, S, k, T, E, M) => (R) => {
      let z = x / S.width, B = _ / S.height, $ = pg([z, 0, 0, 0, B, 0, 0, 0, 1], R);
      y.bindFramebuffer(y.FRAMEBUFFER, S.framebuffer), y.viewport(0, 0, S.width, S.height), y.clearColor(0, 0, 0, 0), y.clear(y.COLOR_BUFFER_BIT), E($), M(S.texture, k, T), y.bindFramebuffer(y.FRAMEBUFFER, k.framebuffer);
      let L = new Float32Array(x * _);
      return y.readPixels(w, w, x, _, y.RED, y.FLOAT, L), y.bindFramebuffer(y.FRAMEBUFFER, null), L;
    }
  );
}
class nT {
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
  vec4f(e, r, n, a) {
    this.align4(), this.f32View[this.offset++] = e, this.f32View[this.offset++] = r, this.f32View[this.offset++] = n, this.f32View[this.offset++] = a;
  }
  mat3x3f(e) {
    this.vec3f(e[0], e[1], e[2]), this.vec3f(e[3], e[4], e[5]), this.vec3f(e[6], e[7], e[8]);
  }
  byteOffset() {
    return this.offset * 4;
  }
}
function iT(t, e) {
  let r = new ArrayBuffer(4288), n = t.statefulDerive(
    [e, 4288, GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST | GPUBufferUsage.VERTEX],
    ws
  );
  return {
    buffer: n,
    update: t.derive([e, n], (a, o) => (l) => {
      let u = new nT(r);
      u.u32(l.count), u.u32(l.category_count), u.i32(l.framebuffer_width), u.i32(l.framebuffer_height), u.i32(l.density_width), u.i32(l.density_height), u.f32(l.gamma), u.f32(l.point_size), u.f32(l.point_alpha), u.f32(l.points_alpha), u.f32(l.density_scaler), u.f32(l.quantization_step), u.f32(l.density_alpha), u.f32(l.contours_alpha), u.mat3x3f(l.matrix), u.vec2f(...l.view_xy_scaler), u.vec4f(...l.kde_causal), u.vec4f(...l.kde_anticausal), u.vec4f(...l.kde_a), u.vec4f(...l.background_color);
      let c = l.gamma;
      for (let f = 0; f < Math.min(l.category_colors.length, 256); f++) {
        let { r: h, g: d, b: g, a: m } = l.category_colors[f];
        h = Math.pow(h, c), d = Math.pow(d, c), g = Math.pow(g, c), u.vec4f(h, d, g, m);
      }
      a.queue.writeBuffer(o, 0, r, 0, u.byteOffset());
    })
  };
}
const j0 = 64, $0 = 64;
function f_(t, e, r, n, a, o) {
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
      o.countBuffer,
      a.count
    ],
    (u, c, f, h, d, g) => (m) => {
      if (m.clearBuffer(d), g == 0)
        return;
      let y = m.beginComputePass();
      y.setPipeline(u), y.setBindGroup(0, c), y.setBindGroup(1, f), y.setBindGroup(2, h), g <= j0 * $0 ? y.dispatchWorkgroups(Math.ceil(g / j0)) : y.dispatchWorkgroups($0, Math.ceil(g / (j0 * $0))), y.end();
    }
  );
}
function aT(t) {
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
function d_(t, e, r, n, a) {
  let o = t.derive([e], (d) => aT(d)), l = t.derive(
    [e, o, r],
    (d, g, m) => d.createBindGroup({
      layout: g.group0,
      entries: [{ binding: 0, resource: { buffer: m } }]
    })
  ), u = t.derive(
    [e, o, n.x, n.y, n.category],
    (d, g, m, y, w) => d.createBindGroup({
      layout: g.group1,
      entries: [
        { binding: 0, resource: { buffer: m } },
        { binding: 1, resource: { buffer: y } },
        { binding: 2, resource: { buffer: w ?? m } }
      ]
    })
  ), c = t.derive(
    [e, o, a.countBuffer, a.blurBuffer],
    (d, g, m, y) => d.createBindGroup({
      layout: g.group2A,
      entries: [{ binding: 0, resource: { buffer: m } }]
    })
  ), f = t.derive(
    [e, o, a.countBuffer, a.blurBuffer],
    (d, g, m, y) => d.createBindGroup({
      layout: g.group2B,
      entries: [
        { binding: 1, resource: { buffer: m } },
        { binding: 2, resource: { buffer: y } }
      ]
    })
  ), h = t.derive(
    [e, o, a.colorTexture, a.alphaTexture],
    (d, g, m, y) => d.createBindGroup({
      layout: g.group3,
      entries: [
        { binding: 0, resource: d.createSampler({}) },
        { binding: 1, resource: m.createView() },
        { binding: 2, resource: y.createView() }
      ]
    })
  );
  return {
    layouts: o,
    group0: l,
    group1: u,
    group2A: c,
    group2B: f,
    group3: h
  };
}
function oT(t, e, r, n, a) {
  const o = t.derive(
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
      o,
      n.group0,
      n.group1,
      n.group2B,
      a.colorTexture,
      a.alphaTexture
    ],
    (l, u, c, f, h, d) => (g) => {
      let m = g.beginRenderPass({
        colorAttachments: [
          { loadOp: "load", storeOp: "store", view: h.createView() },
          { loadOp: "load", storeOp: "store", view: d.createView() }
        ]
      });
      m.setPipeline(l), m.setBindGroup(0, u), m.setBindGroup(1, c), m.setBindGroup(2, f), m.draw(4), m.end();
    }
  );
}
function lT(t, e, r, n, a, o) {
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
            format: o.colorTextureFormat,
            blend: { color: { srcFactor: "one", dstFactor: "one" }, alpha: { srcFactor: "one", dstFactor: "one" } }
          },
          {
            format: o.alphaTextureFormat,
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
      a.count,
      o.colorTexture,
      o.alphaTexture
    ],
    (u, c, f, h, d, g) => (m) => {
      let y = m.beginRenderPass({
        colorAttachments: [
          { clearValue: [0, 0, 0, 0], loadOp: "clear", storeOp: "store", view: d.createView() },
          { clearValue: [0, 0, 0, 0], loadOp: "clear", storeOp: "store", view: g.createView() }
        ]
      });
      y.setPipeline(u), y.setBindGroup(0, c), y.setBindGroup(1, f), h > 0 && y.draw(4, h), y.end();
    }
  );
}
function sT(t, e, r, n, a) {
  const o = t.derive(
    [e, r, a.layouts],
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
    [o, a.group0, a.group1, a.group2B, a.group3],
    (l, u, c, f, h) => (d, g) => {
      let m = d.beginRenderPass({
        colorAttachments: [{ clearValue: [1, 1, 1, 1], loadOp: "clear", storeOp: "store", view: g }]
      });
      m.setPipeline(l), m.setBindGroup(0, u), m.setBindGroup(1, c), m.setBindGroup(2, f), m.setBindGroup(3, h), m.draw(4), m.end();
    }
  );
}
const mb = 64;
function h_(t, e, r, n, a, o, l) {
  let u = t.derive(
    [e, r, n.layouts],
    (f, h, d) => f.createComputePipeline({
      layout: f.createPipelineLayout({
        bindGroupLayouts: [d.group0, d.group1, d.group2B, d.group3]
      }),
      compute: { module: h, entryPoint: "gaussian_blur_stage_1" }
    })
  ), c = t.derive(
    [e, r, n.layouts],
    (f, h, d) => f.createComputePipeline({
      layout: f.createPipelineLayout({
        bindGroupLayouts: [d.group0, d.group1, d.group2B, d.group3]
      }),
      compute: { module: h, entryPoint: "gaussian_blur_stage_2" }
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
      a,
      o,
      l
    ],
    (f, h, d, g, m, y, w, x, _) => (S) => {
      let k = S.beginComputePass();
      k.setBindGroup(0, d), k.setBindGroup(1, g), k.setBindGroup(2, m), k.setBindGroup(3, y), k.setPipeline(f), k.dispatchWorkgroups(Math.ceil(w / mb), _), k.setPipeline(h), k.dispatchWorkgroups(Math.ceil(x / mb), _), k.end();
    }
  );
}
function uT(t, e = !1) {
  const r = new Float64Array(5), n = new Float64Array(4);
  cT(r, n, t);
  const a = Float64Array.of(
    0,
    n[1] - r[1] * n[0],
    n[2] - r[2] * n[0],
    n[3] - r[3] * n[0],
    -r[4] * n[0]
  ), o = 1 + r[1] + r[2] + r[3] + r[4], l = (n[0] + n[1] + n[2] + n[3]) / o, u = (a[1] + a[2] + a[3] + a[4]) / o;
  return {
    sigma: t,
    negative: e,
    a: r,
    b_causal: n,
    b_anticausal: a,
    sum_causal: l,
    sum_anticausal: u
  };
}
function cT(t, e, r) {
  const n = Float64Array.of(
    0.84,
    1.8675,
    0.84,
    -1.8675,
    -0.34015,
    -0.1299,
    -0.34015,
    0.1299
  ), a = Math.exp(-1.783 / r), o = Math.exp(-1.723 / r), l = 0.6318 / r, u = 1.997 / r, c = Float64Array.of(
    -a * Math.cos(l),
    a * Math.sin(l),
    -a * Math.cos(-l),
    a * Math.sin(-l),
    -o * Math.cos(u),
    o * Math.sin(u),
    -o * Math.cos(-u),
    o * Math.sin(-u)
  ), f = r * 2.5066282746310007, h = Float64Array.of(n[0], n[1], 0, 0, 0, 0, 0, 0), d = Float64Array.of(1, 0, c[0], c[1], 0, 0, 0, 0, 0, 0);
  let g, m;
  for (m = 2; m < 8; m += 2) {
    for (h[m] = c[m] * h[m - 2] - c[m + 1] * h[m - 1], h[m + 1] = c[m] * h[m - 1] + c[m + 1] * h[m - 2], g = m - 2; g > 0; g -= 2)
      h[g] += c[m] * h[g - 2] - c[m + 1] * h[g - 1], h[g + 1] += c[m] * h[g - 1] + c[m + 1] * h[g - 2];
    for (g = 0; g <= m; g += 2)
      h[g] += n[m] * d[g] - n[m + 1] * d[g + 1], h[g + 1] += n[m] * d[g + 1] + n[m + 1] * d[g];
    for (d[m + 2] = c[m] * d[m] - c[m + 1] * d[m + 1], d[m + 3] = c[m] * d[m + 1] + c[m + 1] * d[m], g = m; g > 0; g -= 2)
      d[g] += c[m] * d[g - 2] - c[m + 1] * d[g - 1], d[g + 1] += c[m] * d[g - 1] + c[m + 1] * d[g - 2];
  }
  for (m = 0; m < 4; ++m)
    g = m << 1, e[m] = h[g] / f, t[m + 1] = d[g + 2];
}
function v_(t) {
  let e = uT(t);
  return {
    kde_causal: [e.b_causal[0], e.b_causal[1], e.b_causal[2], e.b_causal[3]],
    kde_anticausal: [e.b_anticausal[1], e.b_anticausal[2], e.b_anticausal[3], e.b_anticausal[4]],
    kde_a: [e.a[1], e.a[2], e.a[3], e.a[4]]
  };
}
const fT = `// Copyright (c) 2025 Apple Inc. Licensed under MIT License.

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
class dT {
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
  constructor(e, r, n, a, o) {
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
      width: a,
      height: o
    }, this.viewport = new dd({ x: 0, y: 0, scale: 1 }, a, o), this.df = new Bl();
    let l = this.df;
    this.renderInputs = {
      mode: l.value(this.props.mode),
      colorScheme: l.value(this.props.colorScheme),
      xData: l.value(this.props.x),
      yData: l.value(this.props.y),
      categoryData: l.value(this.props.category),
      categoryCount: l.value(this.props.categoryCount),
      categoryColors: l.value(this.props.categoryColors),
      matrix: l.value(a_()),
      width: l.value(a),
      height: l.value(o),
      pointSize: l.value(this.props.pointSize),
      densityBandwidth: l.value(this.props.densityBandwidth)
    }, this.device = l.value(r), this.dataBuffers = hT(l, this.device, this.renderInputs), this.module = l.derive([this.device], (u) => u.createShaderModule({ code: fT })), this.uniforms = iT(l, this.device), this.renderer = vT(
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
  async densityMap(e, r, n, a) {
    let o = this.df.subgraph(), { x: l, y: u, scale: c } = a, f = [c, 0, 0, 0, c, 0, -l * c, -u * c, 1], h = l_(f), d = await pT(
      o,
      this.device,
      this.module,
      this.uniforms,
      o.value(e),
      o.value(r),
      o.value(n),
      o.value(f),
      this.dataBuffers
    ).value();
    return o.destroy(), {
      data: d,
      width: e,
      height: r,
      coordinateAtPixel: (g, m) => {
        let y = g / e * 2 - 1, w = m / r * 2 - 1, x = o_([y, w, 1], h);
        return { x: x[0], y: x[1] };
      }
    };
  }
}
function hT(t, e, r) {
  let n = GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST;
  const a = t.derive([r.xData], (h) => h.length), o = t.derive([a], (h) => h * 4), l = a, u = t.statefulDerive(
    [e, t.statefulDerive([e, o, n], ws), r.xData],
    F0
  ), c = t.statefulDerive(
    [e, t.statefulDerive([e, o, n], ws), r.yData],
    F0
  ), f = t.statefulDerive(
    [e, t.statefulDerive([e, l, n], ws), r.categoryData],
    F0
  );
  return { x: u, y: c, category: f, count: a };
}
function p_(t, e, r, n, a, o, l) {
  let u = "rgba16float", c = "r16float", f = GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING, h = t.statefulDerive(
    [e, r, n, u, f],
    Hy
  ), d = t.statefulDerive(
    [e, r, n, c, f],
    Hy
  ), g = t.derive(
    [a, o, l],
    (x, _, S) => x * _ * S * 4
    // w * h * categoryCount * sizeof(uint32)
  ), m = t.derive(
    [a, o, l],
    (x, _, S) => x * _ * S * 2
    // w * h * categoryCount * sizeof(f16)
  ), y = t.statefulDerive(
    [e, g, GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC],
    ws
  ), w = t.statefulDerive([e, m, GPUBufferUsage.STORAGE], ws);
  return {
    colorTexture: h,
    alphaTexture: d,
    colorTextureFormat: u,
    alphaTextureFormat: c,
    countBuffer: y,
    blurBuffer: w
  };
}
function vT(t, e, r, n, a, o, l) {
  let u = t.derive([o.densityBandwidth], (E) => Math.ceil(E * 3) + 1), c = t.derive([o.width, u], (E, M) => E + M * 2), f = t.derive([o.height, u], (E, M) => E + M * 2), h = t.derive([c], (E) => Math.ceil(E / 4)), d = t.derive([f], (E) => Math.ceil(E / 4)), g = p_(
    t,
    e,
    c,
    f,
    h,
    d,
    o.categoryCount
  ), m = d_(t, e, n.buffer, l, g), y = f_(t, e, r, m, l, g), w = lT(t, e, r, m, l, g), x = oT(t, e, r, m, g), _ = sT(t, e, r, a, m), S = h_(t, e, r, m, c, f, o.categoryCount), k = t.derive(
    [o.densityBandwidth, c, h],
    (E, M, R) => v_(E / M * R)
  ), T = t.derive(
    [o.categoryColors, o.categoryCount],
    (E, M) => (E == null && (E = Vs(M)), E.map((R) => vg(R)))
  );
  return t.derive(
    [
      e,
      c,
      f,
      h,
      d,
      n.update,
      l.count,
      o.matrix,
      T,
      w,
      _,
      y,
      S,
      x,
      k
    ],
    (E, M, R, z, B, $, L, q, j, W, Y, G, X, K, V) => (U, Z) => {
      let le = U.colorScheme == "light" ? [1, 1, 1, 1] : [0, 0, 0, 1], se = U.width / M, ye = U.height / R, Se = pg([se, 0, 0, 0, ye, 0, 0, 0, 1], q);
      $({
        count: L,
        category_count: U.categoryCount,
        framebuffer_width: M,
        framebuffer_height: R,
        density_width: z,
        density_height: B,
        gamma: U.gamma,
        point_size: Math.max(U.mode == "points" ? 3 : 1, U.pointSize),
        point_alpha: U.pointAlpha,
        points_alpha: U.pointsAlpha,
        density_scaler: U.densityScaler / 16,
        quantization_step: U.densityQuantizationStep,
        density_alpha: U.densityAlpha,
        contours_alpha: U.contoursAlpha,
        matrix: Se,
        view_xy_scaler: [1 / se, 1 / ye],
        kde_causal: V.kde_causal,
        kde_anticausal: V.kde_anticausal,
        kde_a: V.kde_a,
        background_color: le,
        category_colors: j
      });
      let xe = E.createCommandEncoder();
      W(xe), U.mode == "density" && (U.densityAlpha > 0 || U.contoursAlpha > 0) && (G(xe), X(xe), K(xe)), Y(xe, Z), E.queue.submit([xe.finish()]);
    }
  );
}
function pT(t, e, r, n, a, o, l, u, c) {
  let f = p_(t, e, a, o, a, o, t.value(1)), h = d_(t, e, n.buffer, c, f), d = f_(t, e, r, h, c, f), g = h_(t, e, r, h, a, o, t.value(1));
  return t.derive(
    [
      e,
      a,
      o,
      c.count,
      n.update,
      l,
      u,
      d,
      g,
      f.countBuffer
    ],
    (m, y, w, x, _, S, k, T, E, M) => () => {
      let R = m.createCommandEncoder(), z = v_(S);
      _({
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
        matrix: k,
        view_xy_scaler: [1, 1],
        kde_causal: z.kde_causal,
        kde_anticausal: z.kde_anticausal,
        kde_a: z.kde_a,
        background_color: [0, 0, 0, 0],
        category_colors: []
      }), T(R), E(R);
      let B = m.createBuffer({
        size: y * w * 2,
        usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ
      });
      return R.copyBufferToBuffer(M, 0, B, 0, y * w * 2), m.queue.submit([R.finish()]), B.mapAsync(GPUMapMode.READ, 0, y * w * 2).then(() => gT(B.getMappedRange()));
    }
  );
}
function gT(t) {
  let e = new Uint16Array(t), r = new Uint32Array(e.length);
  for (let n = 0; n < e.length; n++) {
    let a = e[n] & 32767, o = e[n] & 32768, l = e[n] & 31744;
    a <<= 13, o <<= 16, a += 939524096, a = l == 0 ? 0 : a, a |= o, r[n] = a;
  }
  return new Float32Array(r.buffer);
}
function mT(t) {
  return t && t.__esModule && Object.prototype.hasOwnProperty.call(t, "default") ? t.default : t;
}
var yb = { exports: {} }, bb;
function yT() {
  return bb || (bb = 1, function(t) {
    (function() {
      function e(u, c) {
        var f = u.x - c.x, h = u.y - c.y;
        return f * f + h * h;
      }
      function r(u, c, f) {
        var h = c.x, d = c.y, g = f.x - h, m = f.y - d;
        if (g !== 0 || m !== 0) {
          var y = ((u.x - h) * g + (u.y - d) * m) / (g * g + m * m);
          y > 1 ? (h = f.x, d = f.y) : y > 0 && (h += g * y, d += m * y);
        }
        return g = u.x - h, m = u.y - d, g * g + m * m;
      }
      function n(u, c) {
        for (var f = u[0], h = [f], d, g = 1, m = u.length; g < m; g++)
          d = u[g], e(d, f) > c && (h.push(d), f = d);
        return f !== d && h.push(d), h;
      }
      function a(u, c, f, h, d) {
        for (var g = h, m, y = c + 1; y < f; y++) {
          var w = r(u[y], u[c], u[f]);
          w > g && (m = y, g = w);
        }
        g > h && (m - c > 1 && a(u, c, m, h, d), d.push(u[m]), f - m > 1 && a(u, m, f, h, d));
      }
      function o(u, c) {
        var f = u.length - 1, h = [u[0]];
        return a(u, 0, f, c, h), h.push(u[f]), h;
      }
      function l(u, c, f) {
        if (u.length <= 2) return u;
        var h = c !== void 0 ? c * c : 1;
        return u = f ? u : n(u, h), u = o(u, h), u;
      }
      t.exports = l, t.exports.default = l;
    })();
  }(yb)), yb.exports;
}
var bT = yT();
const xb = /* @__PURE__ */ mT(bT);
function xT(t, e) {
  let r = t.slice();
  for (let n = 0; n < e; n++) {
    const a = [], o = r.length;
    for (let l = 0; l < o; l++) {
      const u = r[l], c = r[(l + 1) % o], f = {
        x: 0.75 * u.x + 0.25 * c.x,
        y: 0.75 * u.y + 0.25 * c.y
      }, h = {
        x: 0.25 * u.x + 0.75 * c.x,
        y: 0.25 * u.y + 0.75 * c.y
      };
      a.push(f, h);
    }
    r = a;
  }
  return r;
}
function wT(t, e) {
  const r = xT(t, 5), n = Q2(r);
  let a = Math.max(n.xMax - n.xMin, n.yMax - n.yMin) / 100, o = xb(r, a), l = 0;
  for (; o.length > e && l < 20; )
    a *= 1.1, l += 1, o = xb(r, a);
  return o;
}
const wb = {
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
function _T(t, e) {
  return t == null ? wb[e] : { ...wb[e], ...t, ...t[e] != null ? t[e] : {} };
}
let U0 = null, Gv = /* @__PURE__ */ new Map();
function kT() {
  return U0 == null && (U0 = new Promise((t, e) => {
    let r = new Worker(new URL("./clustering.worker.js", import.meta.url), { type: "module" });
    r.onmessage = (n) => {
      if (n.data.ready) {
        t(r);
        return;
      }
      if (n.data.id != null) {
        let a = Gv.get(n.data.id);
        a != null && (Gv.delete(n.data.id), a(n.data));
      }
    };
  })), U0;
}
function g_(t, e, r = []) {
  return new Promise((n, a) => {
    kT().then((o) => {
      let l = (/* @__PURE__ */ new Date()).getTime().toString() + "-" + Math.random().toString();
      Gv.set(l, (u) => {
        n(u.payload);
      }), o.postMessage({ id: l, name: t, payload: e }, r);
    });
  });
}
let ST = (t, e, r, n) => g_("findClusters", { density_map: t, width: e, height: r, options: n }, [t.buffer]), CT = (t, e) => g_("dynamicLabelPlacement", { labels: t, options: e });
function ET(t, e, r, n, a, o) {
  let l = Math.max(n, a) / o, u = t / (r * r) / (l * l), c = 1 / (u / (o * o)) * 0.2, f = Math.sqrt(t / e / (l * l)), h = Math.log(f), d = Math.log(r), g = (Math.min(Math.max((d - h) * 2, -1), 1) + 1) / 2, m = 0.25 / Math.sqrt(u), y = Math.max(0.2, Math.min(5, m)) * o, w = 1 - g, x = 0.5 + g * 0.5;
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
var MT = /* @__PURE__ */ Po("<div></div>"), RT = /* @__PURE__ */ Ha("<circle></circle>"), TT = /* @__PURE__ */ Ha("<circle></circle>"), NT = /* @__PURE__ */ Ha('<text dominant-baseline="middle"> </text>'), FT = /* @__PURE__ */ Ha("<g></g>"), PT = /* @__PURE__ */ Ha("<g><!></g>"), zT = /* @__PURE__ */ Ha("<g></g>"), DT = /* @__PURE__ */ Po('<div><canvas></canvas> <div><!></div> <svg role="none"><!><!><!><!></svg> <!> <!></div>');
function OT(t, e) {
  Dl(e, !0);
  let r = Ye(e, "data", 19, () => ({ x: new Float32Array(), y: new Float32Array(), category: null })), n = Ye(e, "categoryCount", 3, 1), a = Ye(e, "categoryColors", 3, null), o = Ye(e, "width", 3, 800), l = Ye(e, "height", 3, 800), u = Ye(e, "pixelRatio", 3, 2), c = Ye(e, "colorScheme", 3, "light"), f = Ye(e, "theme", 3, null), h = Ye(e, "mode", 3, "density"), d = Ye(e, "minimumDensity", 3, 1 / 16), g = Ye(e, "totalCount", 3, null), m = Ye(e, "maxDensity", 3, null), y = Ye(e, "automaticLabels", 3, !1), w = Ye(e, "queryClusterLabels", 3, null), x = Ye(e, "tooltip", 7, null), _ = Ye(e, "selection", 7, null), S = Ye(e, "querySelection", 3, null), k = Ye(e, "rangeSelection", 7, null), T = Ye(e, "defaultViewportState", 3, null), E = Ye(e, "viewportState", 7, null), M = Ye(e, "customTooltip", 3, null), R = Ye(e, "customOverlay", 3, null), z = Ye(e, "onViewportState", 3, null), B = Ye(e, "onTooltip", 3, null), $ = Ye(e, "onSelection", 3, null), L = Ye(e, "onRangeSelection", 3, null), q = /* @__PURE__ */ Ge(() => _T(f(), c())), j = /* @__PURE__ */ Ge(() => a() ?? Vs(n())), W = /* @__PURE__ */ Ge(() => E() ?? T() ?? { x: 0, y: 0, scale: 1 }), Y = /* @__PURE__ */ Ge(() => new dd(O(W), o(), l())), G = /* @__PURE__ */ Ge(() => O(Y).pixelLocationFunction()), X = /* @__PURE__ */ Ge(() => O(Y).coordinateAtPixelFunction());
  function K(he, ze) {
    return he.x == ze.x && he.y == ze.y && he.category == ze.category && he.text == ze.text;
  }
  let V = /* @__PURE__ */ Ge(() => _()?.length == 1 && x() != null && K(_()[0], x()));
  function U(he) {
    vo(E(), he) || (E(he), z()?.(he));
  }
  function Z(he) {
    vo(x(), he) || (x(he), B()?.(he));
  }
  function le(he) {
    vo(_(), he) || (_(he), $()?.(he));
  }
  function se(he) {
    vo(k(), he) || (k(he), L()?.(he));
  }
  let ye = /* @__PURE__ */ vr(Qo([])), Se = /* @__PURE__ */ vr(null), xe = /* @__PURE__ */ vr("none"), Ee = /* @__PURE__ */ Ge(() => o() * u()), Te = /* @__PURE__ */ Ge(() => l() * u()), Re = /* @__PURE__ */ vr(null), ke = /* @__PURE__ */ vr(null), ge = /* @__PURE__ */ vr(null), we = /* @__PURE__ */ Ge(() => ET(m() ?? (g() ?? r().x.length) / 4, d(), O(W).scale, O(Ee), O(Te), u())), $e = /* @__PURE__ */ Ge(() => O(we).pointSize), qe = !0;
  ud(() => {
    O(ke)?.setProps({
      mode: h(),
      colorScheme: c(),
      viewportX: O(W).x,
      viewportY: O(W).y,
      viewportScale: O(W).scale,
      width: O(Ee),
      height: O(Te),
      x: r().x,
      y: r().y,
      category: r().category,
      categoryCount: n(),
      categoryColors: O(j),
      ...O(we)
    }) && (dt(), y() !== !1 && qe && O(ke) != null && r().x != null && r().x.length > 0 && T() != null && (qe = !1, pr(T())));
  });
  function Ve() {
    rt = null, !(!O(Re) || !O(ke)) && (O(Re).width = O(ke).props.width, O(Re).height = O(ke).props.height, O(Re).style.width = `${O(ke).props.width / u()}px`, O(Re).style.height = `${O(ke).props.height / u()}px`, O(ke).render());
  }
  let rt = null;
  function dt() {
    rt == null && (rt = requestAnimationFrame(Ve));
  }
  function ot(he) {
    let ze;
    function De() {
      ze = he.getContext("webgl2", { antialias: !1 }), ze.getExtension("EXT_color_buffer_float"), ze.getExtension("EXT_float_blend"), ze.getExtension("OES_texture_float_linear"), at(ke, new K9(ze, O(Ee), O(Te)), !0);
    }
    De(), he.addEventListener("webglcontextlost", () => {
      O(ke)?.destroy(), at(ke, null), ze = null;
    }), he.addEventListener("webglcontextrestored", () => {
      De();
    });
  }
  function wt(he) {
    async function ze() {
      let De = he.getContext("webgpu");
      if (De == null) {
        console.error("Could not get WebGPU canvas context");
        return;
      }
      let Oe = await navigator.gpu.requestAdapter();
      if (!Oe) {
        console.error("Could not request WebGPU adapter");
        return;
      }
      let Be = 512 * 1048576, ut = 512 * 1048576;
      Be = Math.min(Be, Oe.limits.maxBufferSize), ut = Math.min(ut, Oe.limits.maxStorageBufferBindingSize);
      let kt = {
        requiredLimits: { maxBufferSize: Be, maxStorageBufferBindingSize: ut },
        requiredFeatures: ["shader-f16"]
      }, ce = await Oe.requestDevice(kt);
      ce.lost.then((Ce) => {
        console.info(`WebGPU device was lost: ${Ce.message}`), Ce.reason != "destroyed" && (O(ke)?.destroy(), at(ke, null), ze());
      });
      let ve = navigator.gpu.getPreferredCanvasFormat();
      De.configure({ device: ce, format: ve, alphaMode: "premultiplied" }), at(ke, new dT(De, ce, ve, O(Ee), O(Te)), !0);
    }
    ze();
  }
  function He(he) {
    he != null && E() == null && U(he);
  }
  ud(() => He(T())), fg(() => {
    O(Re) != null && (i2() ? wt(O(Re)) : (ot(O(Re)), at(ge, "WebGPU is unavailable. If you are using Safari, please enable the WebGPU feature flag.")));
  }), PR(() => {
    O(ke)?.destroy(), at(ke, null);
  });
  function We(he, ze) {
    let { x: De, y: Oe, scale: Be } = O(W);
    Z(null);
    let ut = Math.min(100, Math.max(0.01, Be * he)), kt = O(Re).getBoundingClientRect(), ce = Math.max(kt.width, kt.height), ve = (ze.x - kt.width / 2) / ce * 2, Ce = (kt.height / 2 - ze.y) / ce * 2, ft = De + ve / Be - ve / ut, vt = Oe + Ce / Be - Ce / ut;
    U({ x: ft, y: vt, scale: ut });
  }
  function Mt(he, ze) {
    Z(null);
    let De = "pan";
    switch (O(xe) != "none" ? ze.shift || (De = O(xe)) : ze.shift && (De = ze.meta ? "lasso" : "marquee"), De) {
      case "marquee":
        return {
          move: (Oe) => {
            if (Z(null), O(ke) == null)
              return;
            let Be = O(X)(he.x, he.y), ut = O(X)(Oe.x, Oe.y);
            se({
              xMin: Math.min(Be.x, ut.x),
              yMin: Math.min(Be.y, ut.y),
              xMax: Math.max(Be.x, ut.x),
              yMax: Math.max(Be.y, ut.y)
            });
          }
        };
      case "lasso": {
        let Oe = [O(X)(he.x, he.y)];
        return {
          move: (Be) => {
            Z(null), O(ke) != null && (Oe = [...Oe, O(X)(Be.x, Be.y)], Oe.length >= 3 && se(wT(Oe, 24)));
          }
        };
      }
      case "pan": {
        let Oe = O(X)(0, 0), Be = O(X)(1, 1), ut = Oe.x - Be.x, kt = Oe.y - Be.y, ce = O(W).x, ve = O(W).y;
        return {
          move: (Ce) => {
            U({
              x: ce + (Ce.x - he.x) * ut,
              y: ve + (Ce.y - he.y) * kt,
              scale: O(W).scale
            });
          }
        };
      }
    }
  }
  async function Ze(he, ze) {
    if (k() != null)
      se(null);
    else {
      const De = await _t(he);
      if (De == null)
        le([]), Z(null);
      else if (ze.shift || ze.ctrl || ze.meta) {
        let Oe = _()?.findIndex((Be) => Be.x == De.x && Be.y == De.y && Be.category == De.category);
        _() == null || Oe == null || Oe < 0 ? (le([..._() ?? [], De]), Z(De)) : (le([
          ..._().slice(0, Oe),
          ..._().slice(Oe + 1)
        ]), Z(null));
      } else
        le([De]), Z(De);
    }
  }
  async function Ut(he) {
    if (_() != null && _().length == 1) {
      let ze = O(G)(_()[0].x, _()[0].y);
      he != null && XR(he, ze) < 10 && Z(_()[0]);
    } else
      Z(await _t(he));
  }
  async function _t(he) {
    if (O(ke) == null || he == null || S() == null)
      return null;
    let { x: ze, y: De } = O(X)(he.x, he.y), Oe = Math.abs(O(X)(he.x + 1, he.y).x - ze);
    return await S()(ze, De, Oe);
  }
  function br() {
    return x() != null;
  }
  let ur = /* @__PURE__ */ Ge(() => O(Re) ? VR(O(Re), {
    zoom: We,
    drag: Mt,
    hover: GR(Ut, br),
    click: Ze
  }) : null);
  async function Bt(he, ze, De) {
    let Oe = await he.densityMap(1e3, 1e3, ze, De), Be = await ST(Oe.data, Oe.width, Oe.height, { union_threshold: ze }), ut = [];
    for (let ce = 0; ce < Be.length; ce++) {
      let ve = Be[ce], Ce = Oe.coordinateAtPixel(ve.mean_x, ve.mean_y), ft = ve.boundary_rect_approximation.map(([vt, Rt, zt, Xe]) => {
        let Tt = Oe.coordinateAtPixel(vt, Rt), cr = Oe.coordinateAtPixel(zt, Xe);
        return {
          xMin: Math.min(Tt.x, cr.x),
          xMax: Math.max(Tt.x, cr.x),
          yMin: Math.min(Tt.y, cr.y),
          yMax: Math.max(Tt.y, cr.y)
        };
      });
      ut.push({
        x: Ce.x,
        y: Ce.y,
        sum_density: ve.sum_density,
        rects: ft,
        bandwidth: ze
      });
    }
    let kt = ut.reduce((ce, ve) => Math.max(ce, ve.sum_density), 0) * 5e-3;
    return ut.filter((ce) => ce.sum_density > kt);
  }
  async function At(he) {
    if (O(ke) == null)
      return [];
    let ze = await ZR({ generateLabels: he });
    if (typeof y() == "object" && y().cache) {
      let Be = await y().cache.get(ze);
      if (Be != null)
        return Be;
    }
    at(Se, "Generating clusters...");
    let De = await Bt(O(ke), 10, he);
    if (De = De.concat(await Bt(O(ke), 5, he)), at(Se, "Generating labels (initializing)..."), w())
      for (let Be = 0; Be < De.length; Be++) {
        let ut = await w()(De[Be].rects);
        De[Be].label = ut, at(Se, `Generating labels (${((Be + 1) / De.length * 100).toFixed(0)}%)...`);
      }
    let Oe = De.filter((Be) => Be.label != null).map((Be) => ({
      text: Be.label,
      x: Be.x,
      y: Be.y,
      priority: Be.sum_density,
      level: Be.bandwidth == 10 ? 0 : 1
    }));
    return typeof y() == "object" && y().cache && await y().cache.set(ze, Oe), Oe;
  }
  async function pr(he) {
    if (O(ke) == null)
      return;
    let ze = new dd(he, o(), l()), De = await At(he), Oe = he.scale, Be = he.scale / 2, ut = Be * 4, kt = De.map((ve) => {
      let Ce = ze.pixelLocation(ve.x, ve.y), ft = ve.level == 0 ? 14 : 12, vt = S9({
        text: ve.text,
        fontSize: ft,
        fontFamily: O(q).fontFamily
      });
      vt.width += 4, vt.height += 4;
      let Rt = Oe / ut;
      return {
        text: ve.text,
        fontSize: ft,
        bounds: {
          xMin: Ce.x - vt.width / 2,
          xMax: Ce.x + vt.width / 2,
          yMin: Ce.y - vt.height / 2,
          yMax: Ce.y + vt.height / 2
        },
        locationAtZero: Ce,
        priority: ve.priority,
        minScale: ve.level == 0 ? Rt / 1.2 : null,
        maxScale: ve.level == 0 ? null : Rt,
        coordinate: { x: ve.x, y: ve.y },
        placement: null
      };
    }), ce = await CT(kt, { globalMaxScale: Oe / Be });
    for (let ve = 0; ve < ce.length; ve++) {
      let Ce = ce[ve];
      if (Ce != null) {
        let ft = Oe / Ce.minScale, vt = Oe / Ce.maxScale;
        kt[ve].placement = { minScale: vt, maxScale: ft };
      }
    }
    at(ye, kt, !0), at(Se, null);
  }
  class xn {
    content;
    constructor(ze, De) {
      let Oe = document.createElement("div");
      this.content = Oe, this.update(De), ze.appendChild(Oe);
    }
    update(ze) {
      let De = this.content;
      De.style.fontFamily = ze.fontFamily, c() == "light" ? (De.style.color = "#000", De.style.background = "#fff", De.style.border = "1px solid #000") : (De.style.color = "#ccc", De.style.background = "#000", De.style.border = "1px solid #ccc"), De.style.borderRadius = "2px", De.style.padding = "5px", De.style.fontSize = "12px", De.style.maxWidth = "300px", De.innerText = ze.tooltip.text ?? JSON.stringify(ze.tooltip);
    }
  }
  var wn = DT();
  let Ya;
  var ma = Gr(wn);
  qt(ma, "", {}, { position: "absolute", top: "0", left: "0" }), Iv(ma, (he) => at(Re, he), () => O(Re));
  var Mi = mr(ma, 2);
  let Za;
  var Oo = Gr(Mi);
  {
    var Ka = (he) => {
      var ze = _u();
      const De = /* @__PURE__ */ Ge(() => e_(R())), Oe = /* @__PURE__ */ Ge(() => ({
        location: O(G),
        width: o(),
        height: l()
      }));
      var Be = gs(ze);
      zR(Be, () => O(De), (ut) => {
        var kt = MT();
        BR(kt, (ce, ve) => O(De)?.(ce, ve), () => t_(R(), { proxy: O(Oe) })), kr(ut, kt);
      }), kr(he, ze);
    };
    Mn(Oo, (he) => {
      R() && he(Ka);
    });
  }
  Lr(Mi);
  var un = mr(Mi, 2);
  un.__mousedown = function(...he) {
    O(ur)?.mousedown?.apply(this, he);
  }, un.__mousemove = function(...he) {
    O(ur)?.mousemove?.apply(this, he);
  }, qt(un, "", {}, { position: "absolute", left: "0", top: "0" });
  var Ja = Gr(un);
  {
    var Lo = (he) => {
      var ze = _u();
      const De = /* @__PURE__ */ Ge(() => {
        const { x: kt, y: ce } = O(G)(x().x, x().y);
        return { x: kt, y: ce };
      }), Oe = /* @__PURE__ */ Ge(() => Math.max(3, O($e) / u()) + 1);
      var Be = gs(ze);
      {
        var ut = (kt) => {
          var ce = RT();
          let ve;
          Zn(
            (Ce) => {
              Ae(ce, "cx", O(De).x), Ae(ce, "cy", O(De).y), Ae(ce, "r", O(Oe)), ve = qt(ce, "", ve, Ce);
            },
            [
              () => ({
                stroke: c() == "light" ? "#000" : "#fff",
                "stroke-width": 1,
                fill: "none"
              })
            ]
          ), kr(kt, ce);
        };
        Mn(Be, (kt) => {
          isFinite(O(De).x) && isFinite(O(De).y) && isFinite(O(Oe)) && kt(ut);
        });
      }
      kr(he, ze);
    };
    Mn(Ja, (he) => {
      x() != null && O(ke) != null && he(Lo);
    });
  }
  var Qa = mr(Ja);
  {
    var Wl = (he) => {
      var ze = _u(), De = gs(ze);
      D0(De, 17, _, z0, (Oe, Be) => {
        var ut = _u();
        const kt = /* @__PURE__ */ Ge(() => {
          const { x: vt, y: Rt } = O(G)(O(Be).x, O(Be).y);
          return { x: vt, y: Rt };
        }), ce = /* @__PURE__ */ Ge(() => O(Be).category != null ? O(j)[O(Be).category] : O(j)[0]), ve = /* @__PURE__ */ Ge(() => Math.max(3, O($e) / u()) + 1);
        var Ce = gs(ut);
        {
          var ft = (vt) => {
            var Rt = TT();
            let zt;
            Zn(
              (Xe) => {
                Ae(Rt, "cx", O(kt).x), Ae(Rt, "cy", O(kt).y), Ae(Rt, "r", O(ve)), zt = qt(Rt, "", zt, Xe);
              },
              [
                () => ({
                  stroke: c() == "light" ? "#000" : "#fff",
                  "stroke-width": 2,
                  fill: O(ce)
                })
              ]
            ), kr(vt, Rt);
          };
          Mn(Ce, (vt) => {
            isFinite(O(kt).x) && isFinite(O(kt).y) && isFinite(O(ve)) && vt(ft);
          });
        }
        kr(Oe, ut);
      }), kr(he, ze);
    };
    Mn(Qa, (he) => {
      _() != null && O(ke) != null && he(Wl);
    });
  }
  var Bo = mr(Qa);
  {
    var Qs = (he) => {
      var ze = zT();
      D0(ze, 21, () => O(ye), z0, (De, Oe) => {
        var Be = PT();
        const ut = /* @__PURE__ */ Ge(() => O(Oe).text.split(`
`)), kt = /* @__PURE__ */ Ge(() => O(G)(O(Oe).coordinate.x, O(Oe).coordinate.y)), ce = /* @__PURE__ */ Ge(() => O(Oe).placement != null && O(Oe).placement.minScale <= O(W).scale && O(W).scale <= O(Oe).placement.maxScale);
        var ve = Gr(Be);
        {
          var Ce = (ft) => {
            var vt = FT();
            D0(vt, 21, () => O(ut), z0, (Rt, zt, Xe) => {
              var Tt = NT();
              Ae(Tt, "x", 0);
              let cr;
              var zr = Gr(Tt, !0);
              Lr(Tt), Zn(
                (Mr) => {
                  Ae(Tt, "y", (Xe - (O(ut).length - 1) / 2) * O(Oe).fontSize), Ae(Tt, "font-size", O(Oe).fontSize), cr = qt(Tt, "", cr, Mr), Au(zr, O(zt));
                },
                [
                  () => ({
                    "paint-order": "stroke",
                    "stroke-width": "4",
                    "stroke-linejoin": "round",
                    "stroke-linecap": "round",
                    "text-anchor": "middle",
                    fill: O(q).clusterLabelColor,
                    stroke: O(q).clusterLabelOutlineColor,
                    opacity: O(q).clusterLabelOpacity,
                    "user-select": "none",
                    "-webkit-user-select": "none",
                    "font-family": O(q).fontFamily
                  })
                ]
              ), kr(Rt, Tt);
            }), Lr(vt), kr(ft, vt);
          };
          Mn(ve, (ft) => {
            O(ce) && ft(Ce);
          });
        }
        Lr(Be), Zn(() => Ae(Be, "transform", `translate(${O(kt).x ?? ""},${O(kt).y ?? ""})`)), kr(De, Be);
      }), Lr(ze), kr(he, ze);
    };
    Mn(Bo, (he) => {
      he(Qs);
    });
  }
  var Gl = mr(Bo);
  {
    var Ao = (he) => {
      var ze = _u(), De = gs(ze);
      {
        var Oe = (ut) => {
          JR(ut, {
            get value() {
              return k();
            },
            get pointLocation() {
              return O(G);
            }
          });
        }, Be = (ut) => {
          {
            let kt = /* @__PURE__ */ Ge(() => O(ur)?.preventHover ?? (() => {
            }));
            WR(ut, {
              get value() {
                return k();
              },
              onChange: se,
              get pointLocation() {
                return O(G);
              },
              get coordinateAtPoint() {
                return O(X);
              },
              get preventHover() {
                return O(kt);
              }
            });
          }
        };
        Mn(De, (ut) => {
          k() instanceof Array ? ut(Oe) : ut(Be, !1);
        });
      }
      kr(he, ze);
    };
    Mn(Gl, (he) => {
      k() != null && O(ke) != null && he(Ao);
    });
  }
  Lr(un);
  var qo = mr(un, 2);
  {
    var eu = (he) => {
      const ze = /* @__PURE__ */ Ge(() => O(G)(x().x, x().y));
      {
        let De = /* @__PURE__ */ Ge(() => Math.max(3, O($e) / u())), Oe = /* @__PURE__ */ Ge(() => M() ?? {
          class: xn,
          props: {
            colorScheme: c(),
            fontFamily: O(q).fontFamily
          }
        });
        c9(he, {
          get location() {
            return O(ze);
          },
          get allowInteraction() {
            return O(V);
          },
          get targetHeight() {
            return O(De);
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
    Mn(qo, (he) => {
      x() != null && O(ke) != null && he(eu);
    });
  }
  var Vl = mr(qo, 2);
  {
    var jo = (he) => {
      {
        let ze = /* @__PURE__ */ Ge(() => O(Se) ?? O(ge)), De = /* @__PURE__ */ Ge(() => 1 / (O(G)(1, 0).x - O(G)(0, 0).x));
        l9(he, {
          get resolvedTheme() {
            return O(q);
          },
          get statusMessage() {
            return O(ze);
          },
          get distancePerPoint() {
            return O(De);
          },
          get pointCount() {
            return r().x.length;
          },
          get selectionMode() {
            return O(xe);
          },
          onSelectionMode: (Oe) => at(xe, Oe, !0)
        });
      }
    };
    Mn(Vl, (he) => {
      O(q).statusBar && he(jo);
    });
  }
  return Lr(wn), Zn(
    (he, ze) => {
      Ya = qt(wn, "", Ya, he), Za = qt(Mi, "", Za, ze), Ae(un, "width", o()), Ae(un, "height", l());
    },
    [
      () => ({
        width: `${o() ?? ""}px`,
        height: `${l() ?? ""}px`,
        position: "relative"
      }),
      () => ({
        width: `${o() ?? ""}px`,
        height: `${l() ?? ""}px`,
        position: "absolute",
        top: "0",
        left: "0"
      })
    ]
  ), Qy("wheel", un, function(...he) {
    O(ur)?.wheel?.apply(this, he);
  }), Qy("mouseleave", un, function(...he) {
    O(ur)?.mouseleave?.apply(this, he);
  }), kr(t, wn), Ol({ updateLabels: pr });
}
cg(["mousedown", "mousemove"]);
let LT = "a|about|above|after|again|against|ain|all|am|an|and|any|are|aren|aren't|as|at|be|because|been|before|being|below|between|both|but|by|can|couldn|couldn't|d|did|didn|didn't|do|does|doesn|doesn't|doing|don|don't|down|during|each|few|for|from|further|had|hadn|hadn't|has|hasn|hasn't|have|haven|haven't|having|he|he'd|he'll|her|here|hers|herself|he's|him|himself|his|how|i|i'd|if|i'll|i'm|in|into|is|isn|isn't|it|it'd|it'll|it's|its|itself|i've|just|ll|m|ma|me|mightn|mightn't|more|most|mustn|mustn't|my|myself|needn|needn't|no|nor|not|now|o|of|off|on|once|only|or|other|our|ours|ourselves|out|over|own|re|s|same|shan|shan't|she|she'd|she'll|she's|should|shouldn|shouldn't|should've|so|some|such|t|than|that|that'll|the|their|theirs|them|themselves|then|there|these|they|they'd|they'll|they're|they've|this|those|through|to|too|under|until|up|ve|very|was|wasn|wasn't|we|we'd|we'll|we're|were|weren|weren't|we've|what|when|where|which|while|who|whom|why|will|with|won|won't|wouldn|wouldn't|y|you|you'd|you'll|your|you're|yours|yourself|yourselves|you've", BT = "de|la|que|el|en|y|a|los|del|se|las|por|un|para|con|no|una|su|al|lo|como|más|pero|sus|le|ya|o|este|sí|porque|esta|entre|cuando|muy|sin|sobre|también|me|hasta|hay|donde|quien|desde|todo|nos|durante|todos|uno|les|ni|contra|otros|ese|eso|ante|ellos|e|esto|mí|antes|algunos|qué|unos|yo|otro|otras|otra|él|tanto|esa|estos|mucho|quienes|nada|muchos|cual|poco|ella|estar|estas|algunas|algo|nosotros|mi|mis|tú|te|ti|tu|tus|ellas|nosotras|vosotros|vosotras|os|mío|mía|míos|mías|tuyo|tuya|tuyos|tuyas|suyo|suya|suyos|suyas|nuestro|nuestra|nuestros|nuestras|vuestro|vuestra|vuestros|vuestras|esos|esas|estoy|estás|está|estamos|estáis|están|esté|estés|estemos|estéis|estén|estaré|estarás|estará|estaremos|estaréis|estarán|estaría|estarías|estaríamos|estaríais|estarían|estaba|estabas|estábamos|estabais|estaban|estuve|estuviste|estuvo|estuvimos|estuvisteis|estuvieron|estuviera|estuvieras|estuviéramos|estuvierais|estuvieran|estuviese|estuvieses|estuviésemos|estuvieseis|estuviesen|estando|estado|estada|estados|estadas|estad|he|has|ha|hemos|habéis|han|haya|hayas|hayamos|hayáis|hayan|habré|habrás|habrá|habremos|habréis|habrán|habría|habrías|habríamos|habríais|habrían|había|habías|habíamos|habíais|habían|hube|hubiste|hubo|hubimos|hubisteis|hubieron|hubiera|hubieras|hubiéramos|hubierais|hubieran|hubiese|hubieses|hubiésemos|hubieseis|hubiesen|habiendo|habido|habida|habidos|habidas|soy|eres|es|somos|sois|son|sea|seas|seamos|seáis|sean|seré|serás|será|seremos|seréis|serán|sería|serías|seríamos|seríais|serían|era|eras|éramos|erais|eran|fui|fuiste|fue|fuimos|fuisteis|fueron|fuera|fueras|fuéramos|fuerais|fueran|fuese|fueses|fuésemos|fueseis|fuesen|sintiendo|sentido|sentida|sentidos|sentidas|siente|sentid|tengo|tienes|tiene|tenemos|tenéis|tienen|tenga|tengas|tengamos|tengáis|tengan|tendré|tendrás|tendrá|tendremos|tendréis|tendrán|tendría|tendrías|tendríamos|tendríais|tendrían|tenía|tenías|teníamos|teníais|tenían|tuve|tuviste|tuvo|tuvimos|tuvisteis|tuvieron|tuviera|tuvieras|tuviéramos|tuvierais|tuvieran|tuviese|tuvieses|tuviésemos|tuvieseis|tuviesen|teniendo|tenido|tenida|tenidos|tenidas|tened", AT = "au|aux|avec|ce|ces|dans|de|des|du|elle|en|et|eux|il|ils|je|la|le|les|leur|lui|ma|mais|me|même|mes|moi|mon|ne|nos|notre|nous|on|ou|par|pas|pour|qu|que|qui|sa|se|ses|son|sur|ta|te|tes|toi|ton|tu|un|une|vos|votre|vous|c|d|j|l|à|m|n|s|t|y|été|étée|étées|étés|étant|étante|étants|étantes|suis|es|est|sommes|êtes|sont|serai|seras|sera|serons|serez|seront|serais|serait|serions|seriez|seraient|étais|était|étions|étiez|étaient|fus|fut|fûmes|fûtes|furent|sois|soit|soyons|soyez|soient|fusse|fusses|fût|fussions|fussiez|fussent|ayant|ayante|ayantes|ayants|eu|eue|eues|eus|ai|as|avons|avez|ont|aurai|auras|aura|aurons|aurez|auront|aurais|aurait|aurions|auriez|auraient|avais|avait|avions|aviez|avaient|eut|eûmes|eûtes|eurent|aie|aies|ait|ayons|ayez|aient|eusse|eusses|eût|eussions|eussiez|eussent", qT = "aber|alle|allem|allen|aller|alles|als|also|am|an|ander|andere|anderem|anderen|anderer|anderes|anderm|andern|anderr|anders|auch|auf|aus|bei|bin|bis|bist|da|damit|dann|der|den|des|dem|die|das|dass|daß|derselbe|derselben|denselben|desselben|demselben|dieselbe|dieselben|dasselbe|dazu|dein|deine|deinem|deinen|deiner|deines|denn|derer|dessen|dich|dir|du|dies|diese|diesem|diesen|dieser|dieses|doch|dort|durch|ein|eine|einem|einen|einer|eines|einig|einige|einigem|einigen|einiger|einiges|einmal|er|ihn|ihm|es|etwas|euer|eure|eurem|euren|eurer|eures|für|gegen|gewesen|hab|habe|haben|hat|hatte|hatten|hier|hin|hinter|ich|mich|mir|ihr|ihre|ihrem|ihren|ihrer|ihres|euch|im|in|indem|ins|ist|jede|jedem|jeden|jeder|jedes|jene|jenem|jenen|jener|jenes|jetzt|kann|kein|keine|keinem|keinen|keiner|keines|können|könnte|machen|man|manche|manchem|manchen|mancher|manches|mein|meine|meinem|meinen|meiner|meines|mit|muss|musste|nach|nicht|nichts|noch|nun|nur|ob|oder|ohne|sehr|sein|seine|seinem|seinen|seiner|seines|selbst|sich|sie|ihnen|sind|so|solche|solchem|solchen|solcher|solches|soll|sollte|sondern|sonst|über|um|und|uns|unsere|unserem|unseren|unser|unseres|unter|viel|vom|von|vor|während|war|waren|warst|was|weg|weil|weiter|welche|welchem|welchen|welcher|welches|wenn|werde|werden|wie|wieder|will|wir|wird|wirst|wo|wollen|wollte|würde|würden|zu|zum|zur|zwar|zwischen";
function jT(...t) {
  let e = [];
  for (let r of t) {
    let n = r.split("|");
    e = e.concat(n);
  }
  return e;
}
let $T = jT(LT, BT, AT, qT), UT = class {
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
  constructor(e) {
    this.coordinator = e.coordinator, this.tableName = e.table, this.xColumn = e.x, this.yColumn = e.y, this.textColumn = e.text, this.derivedTableDF = this.tableName + "_df", this.derivedTableBins = this.tableName + "_bt", this.initialized = !1, this.xBinSize = 1, this.yBinSize = 1, this.x0 = 0, this.y0 = 0;
  }
  async initialize() {
    if (this.initialized)
      return;
    let e = co(this.xColumn), r = co(this.yColumn), n = co(this.textColumn), a = await this.coordinator.query(ms`
      SELECT
        MIN(${e}) AS xMin, QUANTILE_CONT(${e}, 0.99) - QUANTILE_CONT(${e}, 0.01) AS xDiff,
        MIN(${r}) AS yMin, QUANTILE_CONT(${r}, 0.99) - QUANTILE_CONT(${r}, 0.01) AS yDiff,
        COUNT(*) AS count
      FROM ${this.tableName}
    `), { xMin: o, yMin: l, xDiff: u, yDiff: c, count: f } = a.get(0);
    this.x0 = o, this.y0 = l, this.xBinSize = u / 200, this.yBinSize = c / 200;
    let h = f < 1e4 ? 1 : 5;
    await this.coordinator.exec(ms`

    `), await this.coordinator.exec(ms`
      CREATE OR REPLACE TEMP MACRO embedding_view_tokenize(s) AS
        unnest(string_split_regex(regexp_replace(lower(s), '[^a-z0-9'']', ' ', 'g'), '\\s+'));

      CREATE OR REPLACE TABLE ${this.derivedTableBins} AS (
        WITH tokens_all AS (
          SELECT
            floor((${e} - ${this.x0}) / ${this.xBinSize})::INT + 32768 * (floor((${r} - ${this.y0}) / ${this.yBinSize})::INT) as xykey,
            embedding_view_tokenize(${n}) AS token
          FROM ${this.tableName}
        )
        SELECT xykey, token, COUNT(*) AS count
        FROM tokens_all
        WHERE token NOT IN ('',${$T.map((d) => tw(d)).join(",")}) AND LENGTH(token) >= 3
        GROUP BY xykey, token
        HAVING count >= ${h}
      );
      CREATE OR REPLACE TABLE ${this.derivedTableDF} AS (
        SELECT sum(count) AS count, stem(token, 'english') AS stem_token
        FROM ${this.derivedTableBins} GROUP BY stem_token
      );
    `), this.initialized = !0;
  }
  indices(e) {
    let r = /* @__PURE__ */ new Set();
    for (let { xMin: n, yMin: a, xMax: o, yMax: l } of e) {
      let u = Math.floor((n - this.x0) / this.xBinSize), c = Math.floor((o - this.x0) / this.xBinSize), f = Math.floor((a - this.y0) / this.yBinSize), h = Math.floor((l - this.y0) / this.yBinSize);
      for (let d = u; d <= c; d++)
        for (let g = f; g <= h; g++) {
          let m = g * 32768 + d;
          r.add(m);
        }
    }
    return Array.from(r);
  }
  async summarize(e, r = 4) {
    await this.initialize();
    let n = this.indices(e), a = ms`
      WITH tokens_tf AS (
        SELECT token, sum(count) AS count
        FROM ${this.derivedTableBins}
        WHERE xykey IN (${n.join(",")})
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
      ORDER BY tfidf DESC limit ${r}
    `;
    return (await this.coordinator.query(a)).getChild("token").toArray();
  }
};
function _b(t, e) {
  if (e.length == 0)
    return N.literal(!1);
  if (t.identifier != null) {
    let r = t.identifier;
    return N.or(...e.map((n) => N.eq(N.column(r), N.literal(n.identifier))));
  } else {
    let r = t.x, n = t.y, a = t.category;
    return a != null ? N.or(
      ...e.map(
        (o) => N.and(
          N.eq(N.cast(N.column(r), "DOUBLE"), N.literal(o.x)),
          N.eq(N.cast(N.column(n), "DOUBLE"), N.literal(o.y)),
          N.eq(N.cast(N.column(a), "INTEGER"), N.literal(o.category))
        )
      )
    ) : N.or(
      ...e.map(
        (o) => N.and(
          N.eq(N.cast(N.column(r), "DOUBLE"), N.literal(o.x)),
          N.eq(N.cast(N.column(n), "DOUBLE"), N.literal(o.y))
        )
      )
    );
  }
}
function IT(t, e, r) {
  let n = [];
  for (let o = 0; o < r.length; o++) {
    let l = (o + 1) % r.length, { x: u, y: c } = r[o], { x: f, y: h } = r[l], d = c < h ? N.and(N.lte(N.literal(c), e), N.lt(e, N.literal(h))) : N.and(N.lte(N.literal(h), e), N.lt(e, N.literal(c))), g = (c < h ? N.lt : N.gt)(
      N.sub(N.mul(N.literal(f - u), e), N.mul(N.literal(h - c), t)),
      N.literal((f - u) * c - (h - c) * u)
    );
    n.push(N.cast(N.and(d, g), "INT"));
  }
  let a = n.reduce((o, l) => N.add(o, l));
  return N.eq(N.mod(a, N.literal(2)), N.literal(1));
}
function HT(t, e) {
  if (e instanceof Array) {
    if (e.length < 3)
      return N.literal(!1);
    let r = Q2(e);
    return N.and(
      N.isBetween(N.column(t.x), [r.xMin, r.xMax]),
      N.isBetween(N.column(t.y), [r.yMin, r.yMax]),
      IT(N.column(t.x), N.column(t.y), e)
    );
  } else
    return N.and(
      N.isBetween(N.column(t.x), [e.xMin, e.xMax]),
      N.isBetween(N.column(t.y), [e.yMin, e.yMax])
    );
}
async function WT(t, e) {
  let { x: r, y: n, table: a } = e, o = await t.query(
    N.Query.from(a).select({
      centerX: N.sql`MEDIAN(${N.column(r)})`,
      centerY: N.sql`MEDIAN(${N.column(n)})`,
      stdX: N.sql`STDDEV(${N.column(r)})`,
      stdY: N.sql`STDDEV(${N.column(n)})`,
      ...e.category != null ? {
        maxCategory: N.sql`MAX(${N.column(e.category)}::UTINYINT)`
      } : {}
    })
  ), { centerX: l, centerY: u, stdX: c, stdY: f, maxCategory: h } = o.get(0), d = 1 / (Math.max(c, f, 1e-3) * 3), g = 0.1 / d, m = N.sql`FLOOR((${N.column(r)} - ${l}) / ${g})`, y = N.sql`FLOOR((${N.column(n)} - ${u}) / ${g})`, w = e.category != null ? N.column(e.category) : null, x = w != null ? [m, y, w] : [m, y], _ = N.Query.from(
    N.Query.from(a).select({ count: N.sql`COUNT(*)` }).groupby(...x)
  ).select({
    totalCount: N.sql`SUM(count)::INT`,
    maxCount: N.sql`MAX(count)::INT`
  });
  o = await t.query(_);
  let { maxCount: S, totalCount: k } = o.get(0), T = S / (g * g);
  return {
    centerX: l,
    centerY: u,
    scaler: d,
    totalCount: k,
    categoryCount: (h ?? 0) + 1,
    maxDensity: T
  };
}
let GT = class {
  coordinator;
  source;
  lastDistance;
  selectParams;
  constructor(e, r) {
    this.coordinator = e, this.source = r, this.lastDistance = 0;
    let { x: n, y: a, category: o, text: l, identifier: u } = this.source, c = {}, f = r.additionalFields ?? {};
    for (let h in f) {
      let d = f[h];
      typeof d == "string" ? c["field_" + h] = N.column(d) : c["field_" + h] = N.sql`${d.sql}`;
    }
    this.selectParams = {
      x: N.sql`${N.column(n)}::DOUBLE`,
      y: N.sql`${N.column(a)}::DOUBLE`,
      ...o != null ? { category: N.sql`${N.column(o)}::INT` } : {},
      ...l != null ? { text: N.sql`${N.column(l)}` } : {},
      ...u != null ? { identifier: N.sql`${N.column(u)}` } : {},
      ...c
    };
  }
  _convertToDataPoint(e) {
    let r = {};
    for (let n in e)
      n.startsWith("field_") && (r[n.slice(6)] = e[n]);
    return {
      x: e.x,
      y: e.y,
      category: e.category,
      text: e.text,
      identifier: e.identifier,
      fields: r
    };
  }
  async queryClosestPoint(e, r, n, a) {
    let o = a * 12, { x: l, y: u } = this.source;
    for (let c of [this.lastDistance, o]) {
      if (c == 0 || c > o)
        continue;
      let f = N.Query.from(this.source.table).select(this.selectParams);
      f = f.where(N.sql`${N.column(l)} BETWEEN ${r - c} AND ${r + c}`), f = f.where(N.sql`${N.column(u)} BETWEEN ${n - c} AND ${n + c}`), e && (f = f.where(e)), f = f.orderby(N.sql`(x - (${r}))**2 + (y - (${n}))**2`).limit(1);
      let h = (await this.coordinator.query(f)).get(0);
      if (h)
        return this.lastDistance = Math.max(Math.abs(h.x - r), Math.abs(h.y - n)) * 4, this._convertToDataPoint(h);
    }
    return null;
  }
  async queryPoints(e) {
    let { table: r, identifier: n } = this.source;
    if (n == null)
      return [];
    let a = N.Query.from(r).select(this.selectParams);
    return a = a.where(
      N.isIn(
        N.column(n),
        e.map((o) => N.literal(o))
      )
    ), Array.from(await this.coordinator.query(a)).map((o) => this._convertToDataPoint(o));
  }
};
function VT(t) {
  let e = t.coordinator ?? Nd(), r = new XT({ ...t, coordinator: e });
  return e.connect(r), r.destroy = () => {
    e.disconnect(r);
  }, r;
}
let XT = class extends Fd {
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
};
function YT(t, e) {
  Dl(e, !0);
  let r = Ye(e, "coordinator", 19, Nd), n = Ye(e, "category", 3, null), a = Ye(e, "text", 3, null), o = Ye(e, "identifier", 3, null), l = Ye(e, "filter", 3, null), u = Ye(e, "categoryColors", 3, null), c = Ye(e, "tooltip", 3, null), f = Ye(e, "additionalFields", 3, null), h = Ye(e, "selection", 3, null), d = Ye(e, "rangeSelection", 3, null), g = Ye(e, "rangeSelectionValue", 3, null), m = Ye(e, "width", 3, null), y = Ye(e, "height", 3, null), w = Ye(e, "pixelRatio", 3, null), x = Ye(e, "colorScheme", 3, "light"), _ = Ye(e, "theme", 3, null), S = Ye(e, "viewportState", 3, null), k = Ye(e, "automaticLabels", 3, !1), T = Ye(e, "mode", 3, "density"), E = Ye(e, "minimumDensity", 3, 1 / 16), M = Ye(e, "customTooltip", 3, null), R = Ye(e, "customOverlay", 3, null), z = Ye(e, "onViewportState", 3, null), B = Ye(e, "onTooltip", 3, null), $ = Ye(e, "onSelection", 3, null), L = Ye(e, "onRangeSelection", 3, null), q = /* @__PURE__ */ vr(new Float32Array()), j = /* @__PURE__ */ vr(new Float32Array()), W = /* @__PURE__ */ vr(null), Y = /* @__PURE__ */ vr(1), G = /* @__PURE__ */ vr(1), X = /* @__PURE__ */ vr(1), K = /* @__PURE__ */ vr(null), V = /* @__PURE__ */ vr(null), U = /* @__PURE__ */ vr(null), Z = /* @__PURE__ */ vr(null), le = /* @__PURE__ */ vr(null);
  Ma(() => {
    let ge = {
      coordinator: r(),
      source: {
        table: e.table,
        x: e.x,
        y: e.y,
        category: n()
      }
    }, we = null, $e = !1;
    async function qe() {
      let Ve = ge.source, rt = await WT(ge.coordinator, Ve);
      if ($e)
        return;
      let dt = rt.scaler * 0.95;
      at(K, {
        x: rt.centerX,
        y: rt.centerY,
        scale: dt
      }), at(G, rt.totalCount), at(X, rt.maxDensity), at(Y, rt.categoryCount), we = VT({
        coordinator: ge.coordinator,
        selection: l(),
        query: (ot) => N.Query.from(Ve.table).select({
          x: N.sql`${N.column(Ve.x)}::FLOAT`,
          y: N.sql`${N.column(Ve.y)}::FLOAT`,
          ...Ve.category != null ? { c: N.sql`${N.column(Ve.category)}::UTINYINT` } : {}
        }).where(ot),
        queryResult: (ot) => {
          let wt = ot.getChild("x").toArray(), He = ot.getChild("y").toArray(), We = ot.getChild("c")?.toArray() ?? null;
          wt != null && !(wt instanceof Float32Array) && (wt = new Float32Array(wt)), He != null && !(He instanceof Float32Array) && (He = new Float32Array(He)), We != null && !(We instanceof Uint8Array) && (We = new Uint8Array(We)), at(q, wt), at(j, He), at(W, We), se(null), ye(null);
        }
      }), we.reset = () => {
        Se();
      }, at(le, we);
    }
    return qe(), () => {
      at(le, null), $e = !0, we?.destroy();
    };
  }), Ma(() => {
    if (_v(c())) {
      let ge = O(le);
      if (ge == null)
        return;
      let we = c();
      at(V, we.value);
      let $e = () => {
        at(V, we.value);
      };
      return Ma(() => {
        let qe = O(V), Ve = {
          x: e.x,
          y: e.y,
          category: n(),
          identifier: o()
        };
        we.update({
          source: ge,
          clients: (/* @__PURE__ */ new Set()).add(ge),
          predicate: qe != null ? _b(Ve, [qe]) : null,
          value: qe
        });
      }), we.addEventListener("value", $e), () => {
        we.removeEventListener("value", $e), we.update({
          source: ge,
          clients: (/* @__PURE__ */ new Set()).add(ge),
          value: null,
          predicate: null
        });
      };
    } else if (c() == null || typeof c() == "object")
      at(V, c());
    else {
      if (O(V)?.identifier == c())
        return;
      let ge = !1;
      return Te([c()]).then((we) => {
        ge || (we.length > 0 ? at(V, we[0]) : at(V, null));
      }), () => {
        ge = !0;
      };
    }
  });
  function se(ge) {
    vo(c(), ge) || (at(V, ge), B()?.(ge));
  }
  Ma(() => {
    if (_v(h())) {
      let ge = O(le);
      if (ge == null)
        return;
      let we = h();
      at(U, we.value);
      let $e = () => {
        at(U, we.value);
      };
      return Ma(() => {
        let qe = O(U), Ve = {
          x: e.x,
          y: e.y,
          category: n(),
          identifier: o()
        };
        we.update({
          source: ge,
          clients: (/* @__PURE__ */ new Set()).add(ge),
          predicate: qe != null ? _b(Ve, qe) : null,
          value: qe
        });
      }), we.addEventListener("value", $e), () => {
        we.removeEventListener("value", $e), we.update({
          source: ge,
          clients: (/* @__PURE__ */ new Set()).add(ge),
          value: null,
          predicate: null
        });
      };
    } else if (h() == null)
      at(U, null);
    else if (h().length == 0)
      at(U, []);
    else if (h().every((ge) => typeof ge == "object"))
      at(U, h());
    else {
      let ge = !1;
      return Te(h()).then((we) => {
        ge || at(U, we);
      }), () => {
        ge = !0;
      };
    }
  });
  function ye(ge) {
    vo(h(), ge) || (at(U, ge), $()?.(ge));
  }
  Ma(() => {
    let ge = O(le);
    if (ge == null)
      return;
    let we = d();
    if (we != null)
      return Ma(() => {
        let $e = O(Z), qe = { x: e.x, y: e.y }, Ve = {
          source: ge,
          clients: (/* @__PURE__ */ new Set()).add(ge),
          predicate: $e != null ? HT(qe, $e) : null,
          value: $e
        };
        we.update(Ve), we.activate(Ve);
      }), () => {
        we.update({
          source: ge,
          clients: (/* @__PURE__ */ new Set()).add(ge),
          value: null,
          predicate: null
        });
      };
  }), Ma(() => {
    vo(Gs(() => O(Z)), g()) || at(Z, g());
  });
  function Se() {
    ye(null), se(null), L()?.(null), at(Z, null);
  }
  let xe = /* @__PURE__ */ Ge(() => new GT(r(), {
    table: e.table,
    x: e.x,
    y: e.y,
    category: n(),
    text: a(),
    identifier: o(),
    additionalFields: f()
  }));
  async function Ee(ge, we, $e) {
    return await O(xe).queryClosestPoint(l()?.predicate?.(O(le)), ge, we, $e);
  }
  async function Te(ge) {
    return await O(xe).queryPoints(ge);
  }
  let Re = /* @__PURE__ */ Ge(() => a() != null ? new UT({
    coordinator: r(),
    table: e.table,
    x: e.x,
    y: e.y,
    text: a()
  }) : null);
  async function ke(ge) {
    if (O(Re) == null)
      return null;
    let we = await O(Re).summarize(ge, 4);
    return we.length > 0 ? we.slice(0, 2).join("-") + `-
` + we.slice(2).join("-") : null;
  }
  {
    let ge = /* @__PURE__ */ Ge(() => T() ?? "points"), we = /* @__PURE__ */ Ge(() => m() ?? 800), $e = /* @__PURE__ */ Ge(() => y() ?? 800), qe = /* @__PURE__ */ Ge(() => w() ?? 2), Ve = /* @__PURE__ */ Ge(() => x() ?? "light"), rt = /* @__PURE__ */ Ge(() => ({
      x: O(q),
      y: O(j),
      category: O(W)
    })), dt = /* @__PURE__ */ Ge(() => a() != null ? k() ?? !1 : !1), ot = /* @__PURE__ */ Ge(() => E() ?? 1 / 16);
    OT(t, {
      get mode() {
        return O(ge);
      },
      get width() {
        return O(we);
      },
      get height() {
        return O($e);
      },
      get pixelRatio() {
        return O(qe);
      },
      get colorScheme() {
        return O(Ve);
      },
      get theme() {
        return _();
      },
      get data() {
        return O(rt);
      },
      get totalCount() {
        return O(G);
      },
      get maxDensity() {
        return O(X);
      },
      get categoryCount() {
        return O(Y);
      },
      get categoryColors() {
        return u();
      },
      get defaultViewportState() {
        return O(K);
      },
      querySelection: Ee,
      queryClusterLabels: ke,
      get automaticLabels() {
        return O(dt);
      },
      get minimumDensity() {
        return O(ot);
      },
      get customTooltip() {
        return M();
      },
      get customOverlay() {
        return R();
      },
      get tooltip() {
        return O(V);
      },
      onTooltip: se,
      get selection() {
        return O(U);
      },
      onSelection: ye,
      get viewportState() {
        return S();
      },
      get onViewportState() {
        return z();
      },
      get rangeSelection() {
        return O(Z);
      },
      onRangeSelection: (wt) => {
        at(Z, wt), L()?.(wt);
      }
    });
  }
  Ol();
}
let ZT = class {
  component;
  currentProps;
  constructor(e, r) {
    this.currentProps = { ...r }, this.component = TR({ component: YT, target: e, props: r });
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
};
function KT() {
  return i2() ? 32 : 4;
}
let JT;
const QT = typeof TextDecoder < "u" ? new TextDecoder("utf-8", { ignoreBOM: !0, fatal: !0 }) : { decode: () => {
  throw Error("TextDecoder not available");
} };
typeof TextDecoder < "u" && QT.decode();
const m_ = new Array(128).fill(void 0);
m_.push(void 0, null, !0, !1);
m_.length;
const I0 = typeof TextEncoder < "u" ? new TextEncoder("utf-8") : { encode: () => {
  throw Error("TextEncoder not available");
} };
I0.encodeInto;
typeof FinalizationRegistry > "u" || new FinalizationRegistry((t) => JT.__wbg_densitymap_free(t >>> 0));
const ti = 2, gg = 4, mg = 8, kc = 16, Wa = 32, Al = 64, y_ = 128, wi = 256, hd = 512, nn = 1024, Ci = 2048, zo = 4096, $i = 8192, ql = 16384, yg = 32768, Zd = 65536, kb = 1 << 17, eN = 1 << 18, bg = 1 << 19, b_ = 1 << 20, Vv = 1 << 21, xg = 1 << 22, fl = 1 << 23, dl = Symbol("$state"), x_ = Symbol("legacy props"), tN = Symbol(""), wg = new class extends Error {
  name = "StaleReactionError";
  message = "The reaction that called `getAbortSignal()` was re-run or destroyed";
}(), w_ = 3, rc = 8, rN = !1;
var Kd = Array.isArray, nN = Array.prototype.indexOf, _g = Array.from, vd = Object.defineProperty, Es = Object.getOwnPropertyDescriptor, __ = Object.getOwnPropertyDescriptors, k_ = Object.prototype, iN = Array.prototype, Jd = Object.getPrototypeOf, Sb = Object.isExtensible;
const aN = () => {
};
function S_(t) {
  for (var e = 0; e < t.length; e++)
    t[e]();
}
function oN() {
  var t, e, r = new Promise((n, a) => {
    t = n, e = a;
  });
  return { promise: r, resolve: t, reject: e };
}
function C_(t) {
  return t === this.v;
}
function kg(t, e) {
  return t != t ? e == e : t !== e || t !== null && typeof t == "object" || typeof t == "function";
}
function lN(t, e) {
  return t !== e;
}
function E_(t) {
  return !kg(t, this.v);
}
function sN() {
  throw new Error("https://svelte.dev/e/await_outside_boundary");
}
function M_(t) {
  throw new Error("https://svelte.dev/e/lifecycle_outside_component");
}
function uN() {
  throw new Error("https://svelte.dev/e/async_derived_orphan");
}
function cN(t) {
  throw new Error("https://svelte.dev/e/effect_in_teardown");
}
function fN() {
  throw new Error("https://svelte.dev/e/effect_in_unowned_derived");
}
function dN(t) {
  throw new Error("https://svelte.dev/e/effect_orphan");
}
function hN() {
  throw new Error("https://svelte.dev/e/effect_update_depth_exceeded");
}
function vN() {
  throw new Error("https://svelte.dev/e/hydration_failed");
}
function pN() {
  throw new Error("https://svelte.dev/e/state_descriptors_fixed");
}
function gN() {
  throw new Error("https://svelte.dev/e/state_prototype_fixed");
}
function mN() {
  throw new Error("https://svelte.dev/e/state_unsafe_mutation");
}
let Sc = !1, yN = !1;
function bN() {
  Sc = !0;
}
const Sg = 1, Cg = 2, R_ = 4, xN = 8, wN = 16, _N = 1, kN = 2, T_ = "[", Eg = "[!", Mg = "]", Ms = {}, Wr = Symbol(), SN = "http://www.w3.org/1999/xhtml", CN = [];
function N_(t, e = !1) {
  return $f(t, /* @__PURE__ */ new Map(), "", CN);
}
function $f(t, e, r, n, a = null) {
  if (typeof t == "object" && t !== null) {
    var o = e.get(t);
    if (o !== void 0) return o;
    if (t instanceof Map) return (
      /** @type {Snapshot<T>} */
      new Map(t)
    );
    if (t instanceof Set) return (
      /** @type {Snapshot<T>} */
      new Set(t)
    );
    if (Kd(t)) {
      var l = (
        /** @type {Snapshot<any>} */
        Array(t.length)
      );
      e.set(t, l), a !== null && e.set(a, l);
      for (var u = 0; u < t.length; u += 1) {
        var c = t[u];
        u in t && (l[u] = $f(c, e, r, n));
      }
      return l;
    }
    if (Jd(t) === k_) {
      l = {}, e.set(t, l), a !== null && e.set(a, l);
      for (var f in t)
        l[f] = $f(t[f], e, r, n);
      return l;
    }
    if (t instanceof Date)
      return (
        /** @type {Snapshot<T>} */
        structuredClone(t)
      );
    if (typeof /** @type {T & { toJSON?: any } } */
    t.toJSON == "function")
      return $f(
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
let Cr = null;
function pd(t) {
  Cr = t;
}
function Nn(t) {
  return (
    /** @type {T} */
    F_().get(t)
  );
}
function pi(t, e) {
  return F_().set(t, e), e;
}
function Fr(t, e = !1, r) {
  Cr = {
    p: Cr,
    c: null,
    e: null,
    s: t,
    x: null,
    l: Sc && !e ? { s: null, u: null, $: [] } : null
  };
}
function Pr(t) {
  var e = (
    /** @type {ComponentContext} */
    Cr
  ), r = e.e;
  if (r !== null) {
    e.e = null;
    for (var n of r)
      tk(n);
  }
  return Cr = e.p, /** @type {T} */
  {};
}
function Ys() {
  return !Sc || Cr !== null && Cr.l === null;
}
function F_(t) {
  return Cr === null && M_(), Cr.c ??= new Map(EN(Cr) || void 0);
}
function EN(t) {
  let e = t.p;
  for (; e !== null; ) {
    const r = e.c;
    if (r !== null)
      return r;
    e = e.p;
  }
  return null;
}
function Qd(t) {
  console.warn("https://svelte.dev/e/hydration_mismatch");
}
let Wt = !1;
function Na(t) {
  Wt = t;
}
let sr;
function Ui(t) {
  if (t === null)
    throw Qd(), Ms;
  return sr = t;
}
function Cc() {
  return Ui(
    /** @type {TemplateNode} */
    /* @__PURE__ */ Do(sr)
  );
}
function Ht(t) {
  if (Wt) {
    if (/* @__PURE__ */ Do(sr) !== null)
      throw Qd(), Ms;
    sr = t;
  }
}
function Xv() {
  for (var t = 0, e = sr; ; ) {
    if (e.nodeType === rc) {
      var r = (
        /** @type {Comment} */
        e.data
      );
      if (r === Mg) {
        if (t === 0) return e;
        t -= 1;
      } else (r === T_ || r === Eg) && (t += 1);
    }
    var n = (
      /** @type {TemplateNode} */
      /* @__PURE__ */ Do(e)
    );
    e.remove(), e = n;
  }
}
function P_(t) {
  if (!t || t.nodeType !== rc)
    throw Qd(), Ms;
  return (
    /** @type {Comment} */
    t.data
  );
}
function an(t) {
  if (typeof t != "object" || t === null || dl in t)
    return t;
  const e = Jd(t);
  if (e !== k_ && e !== iN)
    return t;
  var r = /* @__PURE__ */ new Map(), n = Kd(t), a = /* @__PURE__ */ je(0), o = vl, l = (u) => {
    if (vl === o)
      return u();
    var c = $t, f = vl;
    da(null), Tb(o);
    var h = u();
    return da(c), Tb(f), h;
  };
  return n && r.set("length", /* @__PURE__ */ je(
    /** @type {any[]} */
    t.length
  )), new Proxy(
    /** @type {any} */
    t,
    {
      defineProperty(u, c, f) {
        (!("value" in f) || f.configurable === !1 || f.enumerable === !1 || f.writable === !1) && pN();
        var h = r.get(c);
        return h === void 0 ? h = l(() => {
          var d = /* @__PURE__ */ je(f.value);
          return r.set(c, d), d;
        }) : pe(h, f.value, !0), !0;
      },
      deleteProperty(u, c) {
        var f = r.get(c);
        if (f === void 0) {
          if (c in u) {
            const h = l(() => /* @__PURE__ */ je(Wr));
            r.set(c, h), H0(a);
          }
        } else
          pe(f, Wr), H0(a);
        return !0;
      },
      get(u, c, f) {
        if (c === dl)
          return t;
        var h = r.get(c), d = c in u;
        if (h === void 0 && (!d || Es(u, c)?.writable) && (h = l(() => {
          var m = an(d ? u[c] : Wr), y = /* @__PURE__ */ je(m);
          return y;
        }), r.set(c, h)), h !== void 0) {
          var g = D(h);
          return g === Wr ? void 0 : g;
        }
        return Reflect.get(u, c, f);
      },
      getOwnPropertyDescriptor(u, c) {
        var f = Reflect.getOwnPropertyDescriptor(u, c);
        if (f && "value" in f) {
          var h = r.get(c);
          h && (f.value = D(h));
        } else if (f === void 0) {
          var d = r.get(c), g = d?.v;
          if (d !== void 0 && g !== Wr)
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
        var f = r.get(c), h = f !== void 0 && f.v !== Wr || Reflect.has(u, c);
        if (f !== void 0 || Pt !== null && (!h || Es(u, c)?.writable)) {
          f === void 0 && (f = l(() => {
            var g = h ? an(u[c]) : Wr, m = /* @__PURE__ */ je(g);
            return m;
          }), r.set(c, f));
          var d = D(f);
          if (d === Wr)
            return !1;
        }
        return h;
      },
      set(u, c, f, h) {
        var d = r.get(c), g = c in u;
        if (n && c === "length")
          for (var m = f; m < /** @type {Source<number>} */
          d.v; m += 1) {
            var y = r.get(m + "");
            y !== void 0 ? pe(y, Wr) : m in u && (y = l(() => /* @__PURE__ */ je(Wr)), r.set(m + "", y));
          }
        if (d === void 0)
          (!g || Es(u, c)?.writable) && (d = l(() => /* @__PURE__ */ je(void 0)), pe(d, an(f)), r.set(c, d));
        else {
          g = d.v !== Wr;
          var w = l(() => an(f));
          pe(d, w);
        }
        var x = Reflect.getOwnPropertyDescriptor(u, c);
        if (x?.set && x.set.call(h, f), !g) {
          if (n && typeof c == "string") {
            var _ = (
              /** @type {Source<number>} */
              r.get("length")
            ), S = Number(c);
            Number.isInteger(S) && S >= _.v && pe(_, S + 1);
          }
          H0(a);
        }
        return !0;
      },
      ownKeys(u) {
        D(a);
        var c = Reflect.ownKeys(u).filter((d) => {
          var g = r.get(d);
          return g === void 0 || g.v !== Wr;
        });
        for (var [f, h] of r)
          h.v !== Wr && !(f in u) && c.push(f);
        return c;
      },
      setPrototypeOf() {
        gN();
      }
    }
  );
}
var Yv, z_, D_, O_;
function Zv() {
  if (Yv === void 0) {
    Yv = window, z_ = /Firefox/.test(navigator.userAgent);
    var t = Element.prototype, e = Node.prototype, r = Text.prototype;
    D_ = Es(e, "firstChild").get, O_ = Es(e, "nextSibling").get, Sb(t) && (t.__click = void 0, t.__className = void 0, t.__attributes = null, t.__style = void 0, t.__e = void 0), Sb(r) && (r.__t = void 0);
  }
}
function So(t = "") {
  return document.createTextNode(t);
}
// @__NO_SIDE_EFFECTS__
function kl(t) {
  return D_.call(t);
}
// @__NO_SIDE_EFFECTS__
function Do(t) {
  return O_.call(t);
}
function Yt(t, e) {
  if (!Wt)
    return /* @__PURE__ */ kl(t);
  var r = (
    /** @type {TemplateNode} */
    /* @__PURE__ */ kl(sr)
  );
  if (r === null)
    r = sr.appendChild(So());
  else if (e && r.nodeType !== w_) {
    var n = So();
    return r?.before(n), Ui(n), n;
  }
  return Ui(r), r;
}
function mi(t, e) {
  if (!Wt) {
    var r = (
      /** @type {DocumentFragment} */
      /* @__PURE__ */ kl(
        /** @type {Node} */
        t
      )
    );
    return r instanceof Comment && r.data === "" ? /* @__PURE__ */ Do(r) : r;
  }
  return sr;
}
function yi(t, e = 1, r = !1) {
  let n = Wt ? sr : t;
  for (var a; e--; )
    a = n, n = /** @type {TemplateNode} */
    /* @__PURE__ */ Do(n);
  if (!Wt)
    return n;
  if (r && n?.nodeType !== w_) {
    var o = So();
    return n === null ? a?.after(o) : n.before(o), Ui(o), o;
  }
  return Ui(n), /** @type {TemplateNode} */
  n;
}
function L_(t) {
  t.textContent = "";
}
function B_() {
  return !1;
}
const MN = /* @__PURE__ */ new WeakMap();
function RN(t) {
  var e = Pt;
  if (e === null)
    return $t.f |= fl, t;
  if ((e.f & yg) === 0) {
    if ((e.f & y_) === 0)
      throw !e.parent && t instanceof Error && A_(t), t;
    e.b.error(t);
  } else
    Rg(t, e);
}
function Rg(t, e) {
  for (; e !== null; ) {
    if ((e.f & y_) !== 0)
      try {
        e.b.error(t);
        return;
      } catch (r) {
        t = r;
      }
    e = e.parent;
  }
  throw t instanceof Error && A_(t), t;
}
function A_(t) {
  const e = MN.get(t);
  e && (vd(t, "message", {
    value: e.message
  }), vd(t, "stack", {
    value: e.stack
  }));
}
const TN = typeof requestIdleCallback > "u" ? (t) => setTimeout(t, 1) : requestIdleCallback;
let nc = [], ic = [];
function q_() {
  var t = nc;
  nc = [], S_(t);
}
function j_() {
  var t = ic;
  ic = [], S_(t);
}
function Tg(t) {
  nc.length === 0 && queueMicrotask(q_), nc.push(t);
}
function NN(t) {
  ic.length === 0 && TN(j_), ic.push(t);
}
function FN() {
  nc.length > 0 && q_(), ic.length > 0 && j_();
}
function PN() {
  for (var t = (
    /** @type {Effect} */
    Pt.b
  ); t !== null && !t.has_pending_snippet(); )
    t = t.parent;
  return t === null && sN(), t;
}
// @__NO_SIDE_EFFECTS__
function eh(t) {
  var e = ti | Ci, r = $t !== null && ($t.f & ti) !== 0 ? (
    /** @type {Derived} */
    $t
  ) : null;
  return Pt === null || r !== null && (r.f & wi) !== 0 ? e |= wi : Pt.f |= bg, {
    ctx: Cr,
    deps: null,
    effects: null,
    equals: C_,
    f: e,
    fn: t,
    reactions: null,
    rv: 0,
    v: (
      /** @type {V} */
      Wr
    ),
    wv: 0,
    parent: r ?? Pt,
    ac: null
  };
}
// @__NO_SIDE_EFFECTS__
function zN(t, e) {
  let r = (
    /** @type {Effect | null} */
    Pt
  );
  r === null && uN();
  var n = (
    /** @type {Boundary} */
    r.b
  ), a = (
    /** @type {Promise<V>} */
    /** @type {unknown} */
    void 0
  ), o = ac(
    /** @type {V} */
    Wr
  ), l = null, u = !$t;
  return VN(() => {
    try {
      var c = t();
    } catch (m) {
      c = Promise.reject(m);
    }
    var f = () => c;
    a = l?.then(f, f) ?? Promise.resolve(c), l = a;
    var h = (
      /** @type {Batch} */
      Or
    ), d = n.pending;
    u && (n.update_pending_count(1), d || h.increment());
    const g = (m, y = void 0) => {
      l = null, d || h.activate(), y ? y !== wg && (o.f |= fl, oc(o, y)) : ((o.f & fl) !== 0 && (o.f ^= fl), oc(o, m)), u && (n.update_pending_count(-1), d || h.decrement()), H_();
    };
    if (a.then(g, (m) => g(null, m || "unknown")), h)
      return () => {
        queueMicrotask(() => h.neuter());
      };
  }), new Promise((c) => {
    function f(h) {
      function d() {
        h === a ? c(o) : f(a);
      }
      h.then(d, d);
    }
    f(a);
  });
}
// @__NO_SIDE_EFFECTS__
function Me(t) {
  const e = /* @__PURE__ */ eh(t);
  return Y_(e), e;
}
// @__NO_SIDE_EFFECTS__
function $_(t) {
  const e = /* @__PURE__ */ eh(t);
  return e.equals = E_, e;
}
function U_(t) {
  var e = t.effects;
  if (e !== null) {
    t.effects = null;
    for (var r = 0; r < e.length; r += 1)
      ha(
        /** @type {Effect} */
        e[r]
      );
  }
}
function DN(t) {
  for (var e = t.parent; e !== null; ) {
    if ((e.f & ti) === 0)
      return (
        /** @type {Effect} */
        e
      );
    e = e.parent;
  }
  return null;
}
function Ng(t) {
  var e, r = Pt;
  Co(DN(t));
  try {
    U_(t), e = Q_(t);
  } finally {
    Co(r);
  }
  return e;
}
function I_(t) {
  var e = Ng(t);
  if (t.equals(e) || (t.v = e, t.wv = K_()), !jl)
    if (js !== null)
      js.set(t, t.v);
    else {
      var r = (go || (t.f & wi) !== 0) && t.deps !== null ? zo : nn;
      Bn(t, r);
    }
}
function ON(t, e, r) {
  const n = Ys() ? eh : $_;
  if (e.length === 0) {
    r(t.map(n));
    return;
  }
  var a = Or, o = (
    /** @type {Effect} */
    Pt
  ), l = LN(), u = PN();
  Promise.all(e.map((c) => /* @__PURE__ */ zN(c))).then((c) => {
    a?.activate(), l();
    try {
      r([...t.map(n), ...c]);
    } catch (f) {
      (o.f & ql) === 0 && Rg(f, o);
    }
    a?.deactivate(), H_();
  }).catch((c) => {
    u.error(c);
  });
}
function LN() {
  var t = Pt, e = $t, r = Cr;
  return function() {
    Co(t), da(e), pd(r);
  };
}
function H_() {
  Co(null), da(null), pd(null);
}
const Su = /* @__PURE__ */ new Set();
let Or = null, js = null, Cb = /* @__PURE__ */ new Set(), gd = [];
function W_() {
  const t = (
    /** @type {() => void} */
    gd.shift()
  );
  gd.length > 0 && queueMicrotask(W_), t();
}
let Sl = [], th = null, Kv = !1, Uf = !1;
class $s {
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
  #i = [];
  /**
   * The same as `#async_effects`, but for effects inside a newly-created
   * `<svelte:boundary>` — these do not prevent the batch from committing
   * @type {Effect[]}
   */
  #a = [];
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
  #o = [];
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
      r = /* @__PURE__ */ new Map(), js = /* @__PURE__ */ new Map();
      for (const [o, l] of this.current)
        r.set(o, { v: o.v, wv: o.wv }), o.v = l;
      for (const o of Su)
        if (o !== this)
          for (const [l, u] of o.#e)
            r.has(l) || (r.set(l, { v: l.v, wv: l.wv }), l.v = u);
    }
    for (const o of e)
      this.#v(o);
    if (this.#i.length === 0 && this.#r === 0) {
      this.#h();
      var n = this.#l, a = this.#o;
      this.#l = [], this.#o = [], this.#s = [], Or = null, Eb(n), Eb(a), Or === null ? Or = this : Su.delete(this), this.#n?.resolve();
    } else
      this.#d(this.#l), this.#d(this.#o), this.#d(this.#s);
    if (r) {
      for (const [o, { v: l, wv: u }] of r)
        o.wv <= u && (o.v = l);
      js = null;
    }
    for (const o of this.#i)
      qu(o);
    for (const o of this.#a)
      qu(o);
    this.#i = [], this.#a = [];
  }
  /**
   * Traverse the effect tree, executing effects or stashing
   * them for later execution as appropriate
   * @param {Effect} root
   */
  #v(e) {
    e.f ^= nn;
    for (var r = e.first; r !== null; ) {
      var n = r.f, a = (n & (Wa | Al)) !== 0, o = a && (n & nn) !== 0, l = o || (n & $i) !== 0 || this.skipped_effects.has(r);
      if (!l && r.fn !== null) {
        if (a)
          r.f ^= nn;
        else if ((n & nn) === 0)
          if ((n & gg) !== 0)
            this.#o.push(r);
          else if ((n & xg) !== 0) {
            var u = r.b?.pending ? this.#a : this.#i;
            u.push(r);
          } else rh(r) && ((r.f & kc) !== 0 && this.#s.push(r), qu(r));
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
      ((r.f & Ci) !== 0 ? this.#f : this.#c).push(r), Bn(r, nn);
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
    for (const e of Cb)
      if (Cb.delete(e), e(), Or !== null)
        break;
  }
  neuter() {
    this.#u = !0;
  }
  flush() {
    Sl.length > 0 ? G_() : this.#h(), Or === this && (this.#r === 0 && Su.delete(this), this.deactivate());
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
        Bn(e, Ci), Cl(e);
      for (const e of this.#c)
        Bn(e, zo), Cl(e);
      this.#l = [], this.#o = [], this.flush();
    } else
      this.deactivate();
  }
  /** @param {() => void} fn */
  add_callback(e) {
    this.#t.add(e);
  }
  settled() {
    return (this.#n ??= oN()).promise;
  }
  static ensure() {
    if (Or === null) {
      const e = Or = new $s();
      Su.add(Or), Uf || $s.enqueue(() => {
        Or === e && e.flush();
      });
    }
    return Or;
  }
  /** @param {() => void} task */
  static enqueue(e) {
    gd.length === 0 && queueMicrotask(W_), gd.unshift(e);
  }
}
function BN(t) {
  var e = Uf;
  Uf = !0;
  try {
    for (var r; ; ) {
      if (FN(), Sl.length === 0 && (Or?.flush(), Sl.length === 0))
        return th = null, /** @type {T} */
        r;
      G_();
    }
  } finally {
    Uf = e;
  }
}
function G_() {
  var t = Rs;
  Kv = !0;
  try {
    var e = 0;
    for (Mb(!0); Sl.length > 0; ) {
      var r = $s.ensure();
      if (e++ > 1e3) {
        var n, a;
        AN();
      }
      r.process(Sl), hl.clear();
    }
  } finally {
    Kv = !1, Mb(t), th = null;
  }
}
function AN() {
  try {
    hN();
  } catch (t) {
    Rg(t, th);
  }
}
function Eb(t) {
  var e = t.length;
  if (e !== 0) {
    for (var r = 0; r < e; ) {
      var n = t[r++];
      if ((n.f & (ql | $i)) === 0 && rh(n)) {
        var a = Or ? Or.current.size : 0;
        if (qu(n), n.deps === null && n.first === null && n.nodes_start === null && (n.teardown === null && n.ac === null ? ak(n) : n.fn = null), Or !== null && Or.current.size > a && (n.f & b_) !== 0)
          break;
      }
    }
    for (; r < e; )
      Cl(t[r++]);
  }
}
function Cl(t) {
  for (var e = th = t; e.parent !== null; ) {
    e = e.parent;
    var r = e.f;
    if (Kv && e === Pt && (r & kc) !== 0)
      return;
    if ((r & (Al | Wa)) !== 0) {
      if ((r & nn) === 0) return;
      e.f ^= nn;
    }
  }
  Sl.push(e);
}
const hl = /* @__PURE__ */ new Map();
function ac(t, e) {
  var r = {
    f: 0,
    // TODO ideally we could skip this altogether, but it causes type errors
    v: t,
    reactions: null,
    equals: C_,
    rv: 0,
    wv: 0
  };
  return r;
}
// @__NO_SIDE_EFFECTS__
function je(t, e) {
  const r = ac(t);
  return Y_(r), r;
}
// @__NO_SIDE_EFFECTS__
function V_(t, e = !1, r = !0) {
  const n = ac(t);
  return e || (n.equals = E_), Sc && r && Cr !== null && Cr.l !== null && (Cr.l.s ??= []).push(n), n;
}
function pe(t, e, r = !1) {
  $t !== null && // since we are untracking the function inside `$inspect.with` we need to add this check
  // to ensure we error if state is set inside an inspect effect
  (!na || ($t.f & kb) !== 0) && Ys() && ($t.f & (ti | kc | xg | kb)) !== 0 && !La?.includes(t) && mN();
  let n = r ? an(e) : e;
  return oc(t, n);
}
function oc(t, e) {
  if (!t.equals(e)) {
    var r = t.v;
    jl ? hl.set(t, e) : hl.set(t, r), t.v = e;
    var n = $s.ensure();
    n.capture(t, r), (t.f & ti) !== 0 && ((t.f & Ci) !== 0 && Ng(
      /** @type {Derived} */
      t
    ), Bn(t, (t.f & wi) === 0 ? nn : zo)), t.wv = K_(), X_(t, Ci), Ys() && Pt !== null && (Pt.f & nn) !== 0 && (Pt.f & (Wa | Al)) === 0 && (hi === null ? qN([t]) : hi.push(t));
  }
  return e;
}
function H0(t) {
  pe(t, t.v + 1);
}
function X_(t, e) {
  var r = t.reactions;
  if (r !== null)
    for (var n = Ys(), a = r.length, o = 0; o < a; o++) {
      var l = r[o], u = l.f;
      if (!(!n && l === Pt)) {
        var c = (u & Ci) === 0;
        c && Bn(l, e), (u & ti) !== 0 ? X_(
          /** @type {Derived} */
          l,
          zo
        ) : c && Cl(
          /** @type {Effect} */
          l
        );
      }
    }
}
let Rs = !1;
function Mb(t) {
  Rs = t;
}
let jl = !1;
function Rb(t) {
  jl = t;
}
let $t = null, na = !1;
function da(t) {
  $t = t;
}
let Pt = null;
function Co(t) {
  Pt = t;
}
let La = null;
function Y_(t) {
  $t !== null && (La === null ? La = [t] : La.push(t));
}
let pn = null, Xn = 0, hi = null;
function qN(t) {
  hi = t;
}
let Z_ = 1, lc = 0, vl = lc;
function Tb(t) {
  vl = t;
}
let go = !1;
function K_() {
  return ++Z_;
}
function rh(t) {
  var e = t.f;
  if ((e & Ci) !== 0)
    return !0;
  if ((e & zo) !== 0) {
    var r = t.deps, n = (e & wi) !== 0;
    if (r !== null) {
      var a, o, l = (e & hd) !== 0, u = n && Pt !== null && !go, c = r.length;
      if ((l || u) && (Pt === null || (Pt.f & ql) === 0)) {
        var f = (
          /** @type {Derived} */
          t
        ), h = f.parent;
        for (a = 0; a < c; a++)
          o = r[a], (l || !o?.reactions?.includes(f)) && (o.reactions ??= []).push(f);
        l && (f.f ^= hd), u && h !== null && (h.f & wi) === 0 && (f.f ^= wi);
      }
      for (a = 0; a < c; a++)
        if (o = r[a], rh(
          /** @type {Derived} */
          o
        ) && I_(
          /** @type {Derived} */
          o
        ), o.wv > t.wv)
          return !0;
    }
    (!n || Pt !== null && !go) && Bn(t, nn);
  }
  return !1;
}
function J_(t, e, r = !0) {
  var n = t.reactions;
  if (n !== null && !La?.includes(t))
    for (var a = 0; a < n.length; a++) {
      var o = n[a];
      (o.f & ti) !== 0 ? J_(
        /** @type {Derived} */
        o,
        e,
        !1
      ) : e === o && (r ? Bn(o, Ci) : (o.f & nn) !== 0 && Bn(o, zo), Cl(
        /** @type {Effect} */
        o
      ));
    }
}
function Q_(t) {
  var e = pn, r = Xn, n = hi, a = $t, o = go, l = La, u = Cr, c = na, f = vl, h = t.f;
  pn = /** @type {null | Value[]} */
  null, Xn = 0, hi = null, go = (h & wi) !== 0 && (na || !Rs || $t === null), $t = (h & (Wa | Al)) === 0 ? t : null, La = null, pd(t.ctx), na = !1, vl = ++lc, t.ac !== null && (t.ac.abort(wg), t.ac = null);
  try {
    t.f |= Vv;
    var d = (
      /** @type {Function} */
      (0, t.fn)()
    ), g = t.deps;
    if (pn !== null) {
      var m;
      if (md(t, Xn), g !== null && Xn > 0)
        for (g.length = Xn + pn.length, m = 0; m < pn.length; m++)
          g[Xn + m] = pn[m];
      else
        t.deps = g = pn;
      if (!go || // Deriveds that already have reactions can cleanup, so we still add them as reactions
      (h & ti) !== 0 && /** @type {import('#client').Derived} */
      t.reactions !== null)
        for (m = Xn; m < g.length; m++)
          (g[m].reactions ??= []).push(t);
    } else g !== null && Xn < g.length && (md(t, Xn), g.length = Xn);
    if (Ys() && hi !== null && !na && g !== null && (t.f & (ti | zo | Ci)) === 0)
      for (m = 0; m < /** @type {Source[]} */
      hi.length; m++)
        J_(
          hi[m],
          /** @type {Effect} */
          t
        );
    return a !== null && a !== t && (lc++, hi !== null && (n === null ? n = hi : n.push(.../** @type {Source[]} */
    hi))), (t.f & fl) !== 0 && (t.f ^= fl), d;
  } catch (y) {
    return RN(y);
  } finally {
    t.f ^= Vv, pn = e, Xn = r, hi = n, $t = a, go = o, La = l, pd(u), na = c, vl = f;
  }
}
function jN(t, e) {
  let r = e.reactions;
  if (r !== null) {
    var n = nN.call(r, t);
    if (n !== -1) {
      var a = r.length - 1;
      a === 0 ? r = e.reactions = null : (r[n] = r[a], r.pop());
    }
  }
  r === null && (e.f & ti) !== 0 && // Destroying a child effect while updating a parent effect can cause a dependency to appear
  // to be unused, when in fact it is used by the currently-updating parent. Checking `new_deps`
  // allows us to skip the expensive work of disconnecting and immediately reconnecting it
  (pn === null || !pn.includes(e)) && (Bn(e, zo), (e.f & (wi | hd)) === 0 && (e.f ^= hd), U_(
    /** @type {Derived} **/
    e
  ), md(
    /** @type {Derived} **/
    e,
    0
  ));
}
function md(t, e) {
  var r = t.deps;
  if (r !== null)
    for (var n = e; n < r.length; n++)
      jN(t, r[n]);
}
function qu(t) {
  var e = t.f;
  if ((e & ql) === 0) {
    Bn(t, nn);
    var r = Pt, n = Rs;
    Pt = t, Rs = !0;
    try {
      (e & kc) !== 0 ? XN(t) : ik(t), nk(t);
      var a = Q_(t);
      t.teardown = typeof a == "function" ? a : null, t.wv = Z_;
      var o;
      rN && yN && (t.f & Ci) !== 0 && t.deps;
    } finally {
      Rs = n, Pt = r;
    }
  }
}
function D(t) {
  var e = t.f, r = (e & ti) !== 0;
  if ($t !== null && !na) {
    var n = Pt !== null && (Pt.f & ql) !== 0;
    if (!n && !La?.includes(t)) {
      var a = $t.deps;
      if (($t.f & Vv) !== 0)
        t.rv < lc && (t.rv = lc, pn === null && a !== null && a[Xn] === t ? Xn++ : pn === null ? pn = [t] : (!go || !pn.includes(t)) && pn.push(t));
      else {
        ($t.deps ??= []).push(t);
        var o = t.reactions;
        o === null ? t.reactions = [$t] : o.includes($t) || o.push($t);
      }
    }
  } else if (r && /** @type {Derived} */
  t.deps === null && /** @type {Derived} */
  t.effects === null) {
    var l = (
      /** @type {Derived} */
      t
    ), u = l.parent;
    u !== null && (u.f & wi) === 0 && (l.f ^= wi);
  }
  if (jl) {
    if (hl.has(t))
      return hl.get(t);
    if (r) {
      l = /** @type {Derived} */
      t;
      var c = l.v;
      return ((l.f & nn) === 0 && l.reactions !== null || ek(l)) && (c = Ng(l)), hl.set(l, c), c;
    }
  } else if (r) {
    if (l = /** @type {Derived} */
    t, js?.has(l))
      return js.get(l);
    rh(l) && I_(l);
  }
  if ((t.f & fl) !== 0)
    throw t.v;
  return t.v;
}
function ek(t) {
  if (t.v === Wr) return !0;
  if (t.deps === null) return !1;
  for (const e of t.deps)
    if (hl.has(e) || (e.f & ti) !== 0 && ek(
      /** @type {Derived} */
      e
    ))
      return !0;
  return !1;
}
function nh(t) {
  var e = na;
  try {
    return na = !0, t();
  } finally {
    na = e;
  }
}
const $N = -7169;
function Bn(t, e) {
  t.f = t.f & $N | e;
}
function UN(t) {
  if (!(typeof t != "object" || !t || t instanceof EventTarget)) {
    if (dl in t)
      Jv(t);
    else if (!Array.isArray(t))
      for (let e in t) {
        const r = t[e];
        typeof r == "object" && r && dl in r && Jv(r);
      }
  }
}
function Jv(t, e = /* @__PURE__ */ new Set()) {
  if (typeof t == "object" && t !== null && // We don't want to traverse DOM elements
  !(t instanceof EventTarget) && !e.has(t)) {
    e.add(t), t instanceof Date && t.getTime();
    for (let n in t)
      try {
        Jv(t[n], e);
      } catch {
      }
    const r = Jd(t);
    if (r !== Object.prototype && r !== Array.prototype && r !== Map.prototype && r !== Set.prototype && r !== Date.prototype) {
      const n = __(r);
      for (let a in n) {
        const o = n[a].get;
        if (o)
          try {
            o.call(t);
          } catch {
          }
      }
    }
  }
}
function IN(t) {
  Pt === null && $t === null && dN(), $t !== null && ($t.f & wi) !== 0 && Pt === null && fN(), jl && cN();
}
function HN(t, e) {
  var r = e.last;
  r === null ? e.last = e.first = t : (r.next = t, t.prev = r, e.last = t);
}
function Ga(t, e, r, n = !0) {
  var a = Pt;
  a !== null && (a.f & $i) !== 0 && (t |= $i);
  var o = {
    ctx: Cr,
    deps: null,
    nodes_start: null,
    nodes_end: null,
    f: t | Ci,
    first: null,
    fn: e,
    last: null,
    next: null,
    parent: a,
    b: a && a.b,
    prev: null,
    teardown: null,
    transitions: null,
    wv: 0,
    ac: null
  };
  if (r)
    try {
      qu(o), o.f |= yg;
    } catch (c) {
      throw ha(o), c;
    }
  else e !== null && Cl(o);
  var l = r && o.deps === null && o.first === null && o.nodes_start === null && o.teardown === null && (o.f & bg) === 0;
  if (!l && n && (a !== null && HN(o, a), $t !== null && ($t.f & ti) !== 0 && (t & Al) === 0)) {
    var u = (
      /** @type {Derived} */
      $t
    );
    (u.effects ??= []).push(o);
  }
  return o;
}
function WN(t) {
  const e = Ga(mg, null, !1);
  return Bn(e, nn), e.teardown = t, e;
}
function wr(t) {
  IN();
  var e = (
    /** @type {Effect} */
    Pt.f
  ), r = !$t && (e & Wa) !== 0 && (e & yg) === 0;
  if (r) {
    var n = (
      /** @type {ComponentContext} */
      Cr
    );
    (n.e ??= []).push(t);
  } else
    return tk(t);
}
function tk(t) {
  return Ga(gg | b_, t, !1);
}
function GN(t) {
  $s.ensure();
  const e = Ga(Al, t, !0);
  return (r = {}) => new Promise((n) => {
    r.outro ? ah(e, () => {
      ha(e), n(void 0);
    }) : (ha(e), n(void 0));
  });
}
function Ec(t) {
  return Ga(gg, t, !1);
}
function VN(t) {
  return Ga(xg | bg, t, !0);
}
function rk(t, e = 0) {
  return Ga(mg | e, t, !0);
}
function Br(t, e = [], r = []) {
  ON(e, r, (n) => {
    Ga(mg, () => t(...n.map(D)), !0);
  });
}
function ih(t, e = 0) {
  var r = Ga(kc | e, t, !0);
  return r;
}
function Eo(t, e = !0) {
  return Ga(Wa, t, !0, e);
}
function nk(t) {
  var e = t.teardown;
  if (e !== null) {
    const r = jl, n = $t;
    Rb(!0), da(null);
    try {
      e.call(null);
    } finally {
      Rb(r), da(n);
    }
  }
}
function ik(t, e = !1) {
  var r = t.first;
  for (t.first = t.last = null; r !== null; ) {
    r.ac?.abort(wg);
    var n = r.next;
    (r.f & Al) !== 0 ? r.parent = null : ha(r, e), r = n;
  }
}
function XN(t) {
  for (var e = t.first; e !== null; ) {
    var r = e.next;
    (e.f & Wa) === 0 && ha(e), e = r;
  }
}
function ha(t, e = !0) {
  var r = !1;
  (e || (t.f & eN) !== 0) && t.nodes_start !== null && t.nodes_end !== null && (YN(
    t.nodes_start,
    /** @type {TemplateNode} */
    t.nodes_end
  ), r = !0), ik(t, e && !r), md(t, 0), Bn(t, ql);
  var n = t.transitions;
  if (n !== null)
    for (const o of n)
      o.stop();
  nk(t);
  var a = t.parent;
  a !== null && a.first !== null && ak(t), t.next = t.prev = t.teardown = t.ctx = t.deps = t.fn = t.nodes_start = t.nodes_end = t.ac = null;
}
function YN(t, e) {
  for (; t !== null; ) {
    var r = t === e ? null : (
      /** @type {TemplateNode} */
      /* @__PURE__ */ Do(t)
    );
    t.remove(), t = r;
  }
}
function ak(t) {
  var e = t.parent, r = t.prev, n = t.next;
  r !== null && (r.next = n), n !== null && (n.prev = r), e !== null && (e.first === t && (e.first = n), e.last === t && (e.last = r));
}
function ah(t, e) {
  var r = [];
  Fg(t, r, !0), ok(r, () => {
    ha(t), e && e();
  });
}
function ok(t, e) {
  var r = t.length;
  if (r > 0) {
    var n = () => --r || e();
    for (var a of t)
      a.out(n);
  } else
    e();
}
function Fg(t, e, r) {
  if ((t.f & $i) === 0) {
    if (t.f ^= $i, t.transitions !== null)
      for (const l of t.transitions)
        (l.is_global || r) && e.push(l);
    for (var n = t.first; n !== null; ) {
      var a = n.next, o = (n.f & Zd) !== 0 || (n.f & Wa) !== 0;
      Fg(n, e, o ? r : !1), n = a;
    }
  }
}
function Pg(t) {
  lk(t, !0);
}
function lk(t, e) {
  if ((t.f & $i) !== 0) {
    t.f ^= $i, (t.f & nn) === 0 && (Bn(t, Ci), Cl(t));
    for (var r = t.first; r !== null; ) {
      var n = r.next, a = (r.f & Zd) !== 0 || (r.f & Wa) !== 0;
      lk(r, a ? e : !1), r = n;
    }
    if (t.transitions !== null)
      for (const o of t.transitions)
        (o.is_global || e) && o.in();
  }
}
let Nb = !1;
function ZN() {
  Nb || (Nb = !0, document.addEventListener(
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
function KN(t) {
  var e = $t, r = Pt;
  da(null), Co(null);
  try {
    return t();
  } finally {
    da(e), Co(r);
  }
}
const sk = /* @__PURE__ */ new Set(), Qv = /* @__PURE__ */ new Set();
function JN(t, e, r, n = {}) {
  function a(o) {
    if (n.capture || zu.call(e, o), !o.cancelBubble)
      return KN(() => r?.call(this, o));
  }
  return t.startsWith("pointer") || t.startsWith("touch") || t === "wheel" ? Tg(() => {
    e.addEventListener(t, a, n);
  }) : e.addEventListener(t, a, n), a;
}
function sc(t, e, r, n, a) {
  var o = { capture: n, passive: a }, l = JN(t, e, r, o);
  (e === document.body || // @ts-ignore
  e === window || // @ts-ignore
  e === document || // Firefox has quirky behavior, it can happen that we still get "canplay" events when the element is already removed
  e instanceof HTMLMediaElement) && WN(() => {
    e.removeEventListener(t, l, o);
  });
}
function Va(t) {
  for (var e = 0; e < t.length; e++)
    sk.add(t[e]);
  for (var r of Qv)
    r(t);
}
let Fb = null;
function zu(t) {
  var e = this, r = (
    /** @type {Node} */
    e.ownerDocument
  ), n = t.type, a = t.composedPath?.() || [], o = (
    /** @type {null | Element} */
    a[0] || t.target
  );
  Fb = t;
  var l = 0, u = Fb === t && t.__root;
  if (u) {
    var c = a.indexOf(u);
    if (c !== -1 && (e === document || e === /** @type {any} */
    window)) {
      t.__root = e;
      return;
    }
    var f = a.indexOf(e);
    if (f === -1)
      return;
    c <= f && (l = c);
  }
  if (o = /** @type {Element} */
  a[l] || t.target, o !== e) {
    vd(t, "currentTarget", {
      configurable: !0,
      get() {
        return o || r;
      }
    });
    var h = $t, d = Pt;
    da(null), Co(null);
    try {
      for (var g, m = []; o !== null; ) {
        var y = o.assignedSlot || o.parentNode || /** @type {any} */
        o.host || null;
        try {
          var w = o["__" + n];
          if (w != null && (!/** @type {any} */
          o.disabled || // DOM could've been updated already by the time this is reached, so we check this as well
          // -> the target could not have been disabled because it emits the event in the first place
          t.target === o))
            if (Kd(w)) {
              var [x, ..._] = w;
              x.apply(o, [t, ..._]);
            } else
              w.call(o, t);
        } catch (S) {
          g ? m.push(S) : g = S;
        }
        if (t.cancelBubble || y === e || y === null)
          break;
        o = y;
      }
      if (g) {
        for (let S of m)
          queueMicrotask(() => {
            throw S;
          });
        throw g;
      }
    } finally {
      t.__root = e, delete t.currentTarget, da(h), Co(d);
    }
  }
}
function QN(t) {
  var e = document.createElement("template");
  return e.innerHTML = t.replaceAll("<!>", "<!---->"), e.content;
}
function Ts(t, e) {
  var r = (
    /** @type {Effect} */
    Pt
  );
  r.nodes_start === null && (r.nodes_start = t, r.nodes_end = e);
}
// @__NO_SIDE_EFFECTS__
function Gt(t, e) {
  var r = (e & _N) !== 0, n = (e & kN) !== 0, a, o = !t.startsWith("<!>");
  return () => {
    if (Wt)
      return Ts(sr, null), sr;
    a === void 0 && (a = QN(o ? t : "<!>" + t), r || (a = /** @type {Node} */
    /* @__PURE__ */ kl(a)));
    var l = (
      /** @type {TemplateNode} */
      n || z_ ? document.importNode(a, !0) : a.cloneNode(!0)
    );
    if (r) {
      var u = (
        /** @type {TemplateNode} */
        /* @__PURE__ */ kl(l)
      ), c = (
        /** @type {TemplateNode} */
        l.lastChild
      );
      Ts(u, c);
    } else
      Ts(l, l);
    return l;
  };
}
function ys() {
  if (Wt)
    return Ts(sr, null), sr;
  var t = document.createDocumentFragment(), e = document.createComment(""), r = So();
  return t.append(e, r), Ts(e, r), t;
}
function Ct(t, e) {
  if (Wt) {
    Pt.nodes_end = sr, Cc();
    return;
  }
  t !== null && t.before(
    /** @type {Node} */
    e
  );
}
const eF = ["touchstart", "touchmove"];
function tF(t) {
  return eF.includes(t);
}
function ga(t, e) {
  var r = e == null ? "" : typeof e == "object" ? e + "" : e;
  r !== (t.__t ??= t.nodeValue) && (t.__t = r, t.nodeValue = r + "");
}
function uk(t, e) {
  return ck(t, e);
}
function rF(t, e) {
  Zv(), e.intro = e.intro ?? !1;
  const r = e.target, n = Wt, a = sr;
  try {
    for (var o = (
      /** @type {TemplateNode} */
      /* @__PURE__ */ kl(r)
    ); o && (o.nodeType !== rc || /** @type {Comment} */
    o.data !== T_); )
      o = /** @type {TemplateNode} */
      /* @__PURE__ */ Do(o);
    if (!o)
      throw Ms;
    Na(!0), Ui(
      /** @type {Comment} */
      o
    ), Cc();
    const l = ck(t, { ...e, anchor: o });
    if (sr === null || sr.nodeType !== rc || /** @type {Comment} */
    sr.data !== Mg)
      throw Qd(), Ms;
    return Na(!1), /**  @type {Exports} */
    l;
  } catch (l) {
    if (l === Ms)
      return e.recover === !1 && vN(), Zv(), L_(r), Na(!1), uk(t, e);
    throw l;
  } finally {
    Na(n), Ui(a);
  }
}
const hs = /* @__PURE__ */ new Map();
function ck(t, { target: e, anchor: r, props: n = {}, events: a, context: o, intro: l = !0 }) {
  Zv();
  var u = /* @__PURE__ */ new Set(), c = (d) => {
    for (var g = 0; g < d.length; g++) {
      var m = d[g];
      if (!u.has(m)) {
        u.add(m);
        var y = tF(m);
        e.addEventListener(m, zu, { passive: y });
        var w = hs.get(m);
        w === void 0 ? (document.addEventListener(m, zu, { passive: y }), hs.set(m, 1)) : hs.set(m, w + 1);
      }
    }
  };
  c(_g(sk)), Qv.add(c);
  var f = void 0, h = GN(() => {
    var d = r ?? e.appendChild(So());
    return Eo(() => {
      if (o) {
        Fr({});
        var g = (
          /** @type {ComponentContext} */
          Cr
        );
        g.c = o;
      }
      a && (n.$$events = a), Wt && Ts(
        /** @type {TemplateNode} */
        d,
        null
      ), f = t(d, n) || {}, Wt && (Pt.nodes_end = sr), o && Pr();
    }), () => {
      for (var g of u) {
        e.removeEventListener(g, zu);
        var m = (
          /** @type {number} */
          hs.get(g)
        );
        --m === 0 ? (document.removeEventListener(g, zu), hs.delete(g)) : hs.set(g, m);
      }
      Qv.delete(c), d !== r && d.parentNode?.removeChild(d);
    };
  });
  return ep.set(f, h), f;
}
let ep = /* @__PURE__ */ new WeakMap();
function nF(t, e) {
  const r = ep.get(t);
  return r ? (ep.delete(t), r(e)) : Promise.resolve();
}
function iF(t) {
  return new aF(t);
}
class aF {
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
    var r = /* @__PURE__ */ new Map(), n = (o, l) => {
      var u = /* @__PURE__ */ V_(l, !1, !1);
      return r.set(o, u), u;
    };
    const a = new Proxy(
      { ...e.props || {}, $$events: {} },
      {
        get(o, l) {
          return D(r.get(l) ?? n(l, Reflect.get(o, l)));
        },
        has(o, l) {
          return l === x_ ? !0 : (D(r.get(l) ?? n(l, Reflect.get(o, l))), Reflect.has(o, l));
        },
        set(o, l, u) {
          return pe(r.get(l) ?? n(l, u), u), Reflect.set(o, l, u);
        }
      }
    );
    this.#t = (e.hydrate ? rF : uk)(e.component, {
      target: e.target,
      anchor: e.anchor,
      props: a,
      context: e.context,
      intro: e.intro ?? !1,
      recover: e.recover
    }), (!e?.props?.$$host || e.sync === !1) && BN(), this.#e = a.$$events;
    for (const o of Object.keys(this.#t))
      o === "$set" || o === "$destroy" || o === "$on" || vd(this, o, {
        get() {
          return this.#t[o];
        },
        /** @param {any} value */
        set(l) {
          this.#t[o] = l;
        },
        enumerable: !0
      });
    this.#t.$set = /** @param {Record<string, any>} next */
    (o) => {
      Object.assign(a, o);
    }, this.#t.$destroy = () => {
      nF(this.#t);
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
    const n = (...a) => r.call(this, ...a);
    return this.#e[e].push(n), () => {
      this.#e[e] = this.#e[e].filter(
        /** @param {any} fn */
        (a) => a !== n
      );
    };
  }
  $destroy() {
    this.#t.$destroy();
  }
}
const oF = "5";
typeof window < "u" && ((window.__svelte ??= {}).v ??= /* @__PURE__ */ new Set()).add(oF);
function zg(t, e, ...r) {
  var n = t, a = aN, o;
  ih(() => {
    a !== (a = e()) && (o && (ha(o), o = null), o = Eo(() => (
      /** @type {SnippetFn} */
      a(n, ...r)
    )));
  }, Zd), Wt && (n = sr);
}
function Zs(t) {
  Cr === null && M_(), Sc && Cr.l !== null ? lF(Cr).m.push(t) : wr(() => {
    const e = nh(t);
    if (typeof e == "function") return (
      /** @type {() => void} */
      e
    );
  });
}
function lF(t) {
  var e = (
    /** @type {ComponentContextLegacy} */
    t.l
  );
  return e.u ??= { a: [], b: [], m: [] };
}
function Yn(t, e, r = !1) {
  Wt && Cc();
  var n = t, a = null, o = null, l = Wr, u = r ? Zd : 0, c = !1;
  const f = (g, m = !0) => {
    c = !0, d(m, g);
  };
  function h() {
    var g = l ? a : o, m = l ? o : a;
    g && Pg(g), m && ah(m, () => {
      l ? o = null : a = null;
    });
  }
  const d = (g, m) => {
    if (l === (l = g)) return;
    let y = !1;
    if (Wt) {
      const _ = P_(n) === Eg;
      !!l === _ && (n = Xv(), Ui(n), Na(!1), y = !0);
    }
    var w = B_(), x = n;
    l ? a ??= m && Eo(() => m(x)) : o ??= m && Eo(() => m(x)), w || h(), y && Na(!0);
  };
  ih(() => {
    c = !1, e(f), c || d(null, null);
  }, u), Wt && (n = sr);
}
function sF(t, e, r) {
  Wt && Cc();
  var n = t, a = Wr, o, l, u = null, c = Ys() ? lN : kg;
  function f() {
    o && ah(o), u !== null && (u.lastChild.remove(), n.before(u), u = null), o = l;
  }
  ih(() => {
    if (c(a, a = e())) {
      var h = n, d = B_();
      d && (u = document.createDocumentFragment(), u.append(h = So())), l = Eo(() => r(h)), d ? Or.add_callback(f) : f();
    }
  }), Wt && (n = sr);
}
function uF(t, e) {
  return e;
}
function cF(t, e, r) {
  for (var n = t.items, a = [], o = e.length, l = 0; l < o; l++)
    Fg(e[l].e, a, !0);
  var u = o > 0 && a.length === 0 && r !== null;
  if (u) {
    var c = (
      /** @type {Element} */
      /** @type {Element} */
      r.parentNode
    );
    L_(c), c.append(
      /** @type {Element} */
      r
    ), n.clear(), ea(t, e[0].prev, e[o - 1].next);
  }
  ok(a, () => {
    for (var f = 0; f < o; f++) {
      var h = e[f];
      u || (n.delete(h.k), ea(t, h.prev, h.next)), ha(h.e, !u);
    }
  });
}
function ju(t, e, r, n, a, o = null) {
  var l = t, u = { flags: e, items: /* @__PURE__ */ new Map(), first: null }, c = (e & R_) !== 0;
  if (c) {
    var f = (
      /** @type {Element} */
      t
    );
    l = Wt ? Ui(
      /** @type {Comment | Text} */
      /* @__PURE__ */ kl(f)
    ) : f.appendChild(So());
  }
  Wt && Cc();
  var h = null, d = !1, g = /* @__PURE__ */ new Map(), m = /* @__PURE__ */ $_(() => {
    var _ = r();
    return Kd(_) ? _ : _ == null ? [] : _g(_);
  }), y, w;
  function x() {
    fF(
      w,
      y,
      u,
      g,
      l,
      a,
      e,
      n,
      r
    ), o !== null && (y.length === 0 ? h ? Pg(h) : h = Eo(() => o(l)) : h !== null && ah(h, () => {
      h = null;
    }));
  }
  ih(() => {
    w ??= /** @type {Effect} */
    Pt, y = D(m);
    var _ = y.length;
    if (d && _ === 0)
      return;
    d = _ === 0;
    let S = !1;
    if (Wt) {
      var k = P_(l) === Eg;
      k !== (_ === 0) && (l = Xv(), Ui(l), Na(!1), S = !0);
    }
    if (Wt) {
      for (var T = null, E, M = 0; M < _; M++) {
        if (sr.nodeType === rc && /** @type {Comment} */
        sr.data === Mg) {
          l = /** @type {Comment} */
          sr, S = !0, Na(!1);
          break;
        }
        var R = y[M], z = n(R, M);
        E = fk(
          sr,
          u,
          T,
          null,
          R,
          z,
          M,
          a,
          e,
          r
        ), u.items.set(z, E), T = E;
      }
      _ > 0 && Ui(Xv());
    }
    Wt ? _ === 0 && o && (h = Eo(() => o(l))) : x(), S && Na(!0), D(m);
  }), Wt && (l = sr);
}
function fF(t, e, r, n, a, o, l, u, c) {
  var f = (l & xN) !== 0, h = (l & (Sg | Cg)) !== 0, d = e.length, g = r.items, m = r.first, y = m, w, x = null, _, S = [], k = [], T, E, M, R;
  if (f)
    for (R = 0; R < d; R += 1)
      T = e[R], E = u(T, R), M = g.get(E), M !== void 0 && (M.a?.measure(), (_ ??= /* @__PURE__ */ new Set()).add(M));
  for (R = 0; R < d; R += 1) {
    if (T = e[R], E = u(T, R), M = g.get(E), M === void 0) {
      var z = n.get(E);
      if (z !== void 0) {
        n.delete(E), g.set(E, z);
        var B = x ? x.next : y;
        ea(r, x, z), ea(r, z, B), W0(z, B, a), x = z;
      } else {
        var $ = y ? (
          /** @type {TemplateNode} */
          y.e.nodes_start
        ) : a;
        x = fk(
          $,
          r,
          x,
          x === null ? r.first : x.next,
          T,
          E,
          R,
          o,
          l,
          c
        );
      }
      g.set(E, x), S = [], k = [], y = x.next;
      continue;
    }
    if (h && dF(M, T, R, l), (M.e.f & $i) !== 0 && (Pg(M.e), f && (M.a?.unfix(), (_ ??= /* @__PURE__ */ new Set()).delete(M))), M !== y) {
      if (w !== void 0 && w.has(M)) {
        if (S.length < k.length) {
          var L = k[0], q;
          x = L.prev;
          var j = S[0], W = S[S.length - 1];
          for (q = 0; q < S.length; q += 1)
            W0(S[q], L, a);
          for (q = 0; q < k.length; q += 1)
            w.delete(k[q]);
          ea(r, j.prev, W.next), ea(r, x, j), ea(r, W, L), y = L, x = W, R -= 1, S = [], k = [];
        } else
          w.delete(M), W0(M, y, a), ea(r, M.prev, M.next), ea(r, M, x === null ? r.first : x.next), ea(r, x, M), x = M;
        continue;
      }
      for (S = [], k = []; y !== null && y.k !== E; )
        (y.e.f & $i) === 0 && (w ??= /* @__PURE__ */ new Set()).add(y), k.push(y), y = y.next;
      if (y === null)
        continue;
      M = y;
    }
    S.push(M), x = M, y = M.next;
  }
  if (y !== null || w !== void 0) {
    for (var Y = w === void 0 ? [] : _g(w); y !== null; )
      (y.e.f & $i) === 0 && Y.push(y), y = y.next;
    var G = Y.length;
    if (G > 0) {
      var X = (l & R_) !== 0 && d === 0 ? a : null;
      if (f) {
        for (R = 0; R < G; R += 1)
          Y[R].a?.measure();
        for (R = 0; R < G; R += 1)
          Y[R].a?.fix();
      }
      cF(r, Y, X);
    }
  }
  f && Tg(() => {
    if (_ !== void 0)
      for (M of _)
        M.a?.apply();
  }), t.first = r.first && r.first.e, t.last = x && x.e;
  for (var K of n.values())
    ha(K.e);
  n.clear();
}
function dF(t, e, r, n) {
  (n & Sg) !== 0 && oc(t.v, e), (n & Cg) !== 0 ? oc(
    /** @type {Value<number>} */
    t.i,
    r
  ) : t.i = r;
}
function fk(t, e, r, n, a, o, l, u, c, f, h) {
  var d = (c & Sg) !== 0, g = (c & wN) === 0, m = d ? g ? /* @__PURE__ */ V_(a, !1, !1) : ac(a) : a, y = (c & Cg) === 0 ? l : ac(l), w = {
    i: y,
    v: m,
    k: o,
    a: null,
    // @ts-expect-error
    e: null,
    prev: r,
    next: n
  };
  try {
    if (t === null) {
      var x = document.createDocumentFragment();
      x.append(t = So());
    }
    return w.e = Eo(() => u(
      /** @type {Node} */
      t,
      m,
      y,
      f
    ), Wt), w.e.prev = r && r.e, w.e.next = n && n.e, r === null ? h || (e.first = w) : (r.next = w, r.e.next = w.e), n !== null && (n.prev = w, n.e.prev = w.e), w;
  } finally {
  }
}
function W0(t, e, r) {
  for (var n = t.next ? (
    /** @type {TemplateNode} */
    t.next.e.nodes_start
  ) : r, a = e ? (
    /** @type {TemplateNode} */
    e.e.nodes_start
  ) : r, o = (
    /** @type {TemplateNode} */
    t.e.nodes_start
  ); o !== null && o !== n; ) {
    var l = (
      /** @type {TemplateNode} */
      /* @__PURE__ */ Do(o)
    );
    a.before(o), o = l;
  }
}
function ea(t, e, r) {
  e === null ? t.first = r : (e.next = r, e.e.next = r && r.e), r !== null && (r.prev = e, r.e.prev = e && e.e);
}
function Er(t, e) {
  Ec(() => {
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
      const a = document.createElement("style");
      a.id = e.hash, a.textContent = e.code, n.appendChild(a);
    }
  });
}
function Dg(t, e, r) {
  Ec(() => {
    var n = nh(() => e(t, r?.()) || {});
    if (r && n?.update) {
      var a = !1, o = (
        /** @type {any} */
        {}
      );
      rk(() => {
        var l = r();
        UN(l), a && kg(o, l) && (o = l, n.update(l));
      }), a = !0;
    }
    if (n?.destroy)
      return () => (
        /** @type {Function} */
        n.destroy()
      );
  });
}
function hF(t, e, r) {
  var n = t == null ? "" : "" + t;
  return e && (n = n ? n + " " + e : e), n === "" ? null : n;
}
function Pb(t, e = !1) {
  var r = e ? " !important;" : ";", n = "";
  for (var a in t) {
    var o = t[a];
    o != null && o !== "" && (n += " " + a + ": " + o + r);
  }
  return n;
}
function vF(t, e) {
  if (e) {
    var r = "", n, a;
    return Array.isArray(e) ? (n = e[0], a = e[1]) : n = e, n && (r += Pb(n)), a && (r += Pb(a, !0)), r = r.trim(), r === "" ? null : r;
  }
  return String(t);
}
function Mo(t, e, r, n, a, o) {
  var l = t.__className;
  if (Wt || l !== r || l === void 0) {
    var u = hF(r, n);
    (!Wt || u !== t.getAttribute("class")) && (u == null ? t.removeAttribute("class") : t.className = u), t.__className = r;
  }
  return o;
}
function G0(t, e = {}, r, n) {
  for (var a in r) {
    var o = r[a];
    e[a] !== o && (r[a] == null ? t.style.removeProperty(a) : t.style.setProperty(a, o, n));
  }
}
function qn(t, e, r, n) {
  var a = t.__style;
  if (Wt || a !== e) {
    var o = vF(e, n);
    (!Wt || o !== t.getAttribute("style")) && (o == null ? t.removeAttribute("style") : t.style.cssText = o), t.__style = e;
  } else n && (Array.isArray(n) ? (G0(t, r?.[0], n[0]), G0(t, r?.[1], n[1], "important")) : G0(t, r, n));
  return n;
}
const pF = Symbol("is custom element"), gF = Symbol("is html");
function mF(t) {
  if (Wt) {
    var e = !1, r = () => {
      if (!e) {
        if (e = !0, t.hasAttribute("value")) {
          var n = t.value;
          yd(t, "value", null), t.value = n;
        }
        if (t.hasAttribute("checked")) {
          var a = t.checked;
          yd(t, "checked", null), t.checked = a;
        }
      }
    };
    t.__on_r = r, NN(r), ZN();
  }
}
function yF(t, e) {
  var r = dk(t);
  r.checked !== (r.checked = // treat null and undefined the same for the initial value
  e ?? void 0) && (t.checked = e);
}
function yd(t, e, r, n) {
  var a = dk(t);
  Wt && (a[e] = t.getAttribute(e), e === "src" || e === "srcset" || e === "href" && t.nodeName === "LINK") || a[e] !== (a[e] = r) && (e === "loading" && (t[tN] = r), r == null ? t.removeAttribute(e) : typeof r != "string" && bF(t).includes(e) ? t[e] = r : t.setAttribute(e, r));
}
function dk(t) {
  return (
    /** @type {Record<string | symbol, unknown>} **/
    // @ts-expect-error
    t.__attributes ??= {
      [pF]: t.nodeName.includes("-"),
      [gF]: t.namespaceURI === SN
    }
  );
}
var zb = /* @__PURE__ */ new Map();
function bF(t) {
  var e = zb.get(t.nodeName);
  if (e) return e;
  zb.set(t.nodeName, e = []);
  for (var r, n = t, a = Element.prototype; a !== n; ) {
    r = __(n);
    for (var o in r)
      r[o].set && e.push(o);
    n = Jd(n);
  }
  return e;
}
class Og {
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
      var a = this.#e.get(e);
      a.delete(r), a.size === 0 && (this.#e.delete(e), this.#t.unobserve(e));
    };
  }
  #n() {
    return this.#t ?? (this.#t = new ResizeObserver(
      /** @param {any} entries */
      (e) => {
        for (var r of e) {
          Og.entries.set(r.target, r);
          for (var n of this.#e.get(r.target) || [])
            n(r);
        }
      }
    ));
  }
}
var xF = /* @__PURE__ */ new Og({
  box: "border-box"
});
function Hi(t, e, r) {
  var n = xF.observe(t, () => r(t[e]));
  Ec(() => (nh(() => r(t[e])), n));
}
function Db(t, e) {
  return t === e || t?.[dl] === e;
}
function An(t = {}, e, r, n) {
  return Ec(() => {
    var a, o;
    return rk(() => {
      a = o, o = [], nh(() => {
        t !== r(...o) && (e(t, ...o), a && Db(r(...a), t) && e(null, ...a));
      });
    }), () => {
      Tg(() => {
        o && Db(r(...o), t) && e(null, ...o);
      });
    };
  }), t;
}
let Cf = !1;
function wF(t) {
  var e = Cf;
  try {
    return Cf = !1, [t(), Cf];
  } finally {
    Cf = e;
  }
}
function Mc(t, e, r, n) {
  var a = (
    /** @type {V} */
    n
  ), o = !0, l = () => (o && (o = !1, a = /** @type {V} */
  n), a), u;
  {
    var c = dl in t || x_ in t;
    u = Es(t, e)?.set ?? (c && e in t ? (x) => t[e] = x : void 0);
  }
  var f, h = !1;
  [f, h] = wF(() => (
    /** @type {V} */
    t[e]
  ));
  var d;
  if (d = () => {
    var x = (
      /** @type {V} */
      t[e]
    );
    return x === void 0 ? l() : (o = !0, x);
  }, u) {
    var g = t.$$legacy;
    return function(x, _) {
      return arguments.length > 0 ? ((!_ || g || h) && u(_ ? d() : x), x) : d();
    };
  }
  var m = !1, y = /* @__PURE__ */ eh(() => (m = !1, d()));
  D(y);
  var w = (
    /** @type {Effect} */
    Pt
  );
  return function(x, _) {
    if (arguments.length > 0) {
      const S = _ ? D(y) : an(x);
      return pe(y, S), m = !0, a !== void 0 && (a = S), x;
    }
    return jl && m || (w.f & ql) !== 0 ? y.v : D(y);
  };
}
var mo = typeof globalThis < "u" ? globalThis : typeof window < "u" ? window : typeof global < "u" ? global : typeof self < "u" ? self : {};
function Lg(t) {
  return t && t.__esModule && Object.prototype.hasOwnProperty.call(t, "default") ? t.default : t;
}
var If = { exports: {} };
/**
 * @license
 * Lodash <https://lodash.com/>
 * Copyright OpenJS Foundation and other contributors <https://openjsf.org/>
 * Released under MIT license <https://lodash.com/license>
 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
 * Copyright Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 */
var _F = If.exports, Ob;
function kF() {
  return Ob || (Ob = 1, function(t, e) {
    (function() {
      var r, n = "4.17.21", a = 200, o = "Unsupported core-js use. Try https://npms.io/search?q=ponyfill.", l = "Expected a function", u = "Invalid `variable` option passed into `_.template`", c = "__lodash_hash_undefined__", f = 500, h = "__lodash_placeholder__", d = 1, g = 2, m = 4, y = 1, w = 2, x = 1, _ = 2, S = 4, k = 8, T = 16, E = 32, M = 64, R = 128, z = 256, B = 512, $ = 30, L = "...", q = 800, j = 16, W = 1, Y = 2, G = 3, X = 1 / 0, K = 9007199254740991, V = 17976931348623157e292, U = NaN, Z = 4294967295, le = Z - 1, se = Z >>> 1, ye = [
        ["ary", R],
        ["bind", x],
        ["bindKey", _],
        ["curry", k],
        ["curryRight", T],
        ["flip", B],
        ["partial", E],
        ["partialRight", M],
        ["rearg", z]
      ], Se = "[object Arguments]", xe = "[object Array]", Ee = "[object AsyncFunction]", Te = "[object Boolean]", Re = "[object Date]", ke = "[object DOMException]", ge = "[object Error]", we = "[object Function]", $e = "[object GeneratorFunction]", qe = "[object Map]", Ve = "[object Number]", rt = "[object Null]", dt = "[object Object]", ot = "[object Promise]", wt = "[object Proxy]", He = "[object RegExp]", We = "[object Set]", Mt = "[object String]", Ze = "[object Symbol]", Ut = "[object Undefined]", _t = "[object WeakMap]", br = "[object WeakSet]", ur = "[object ArrayBuffer]", Bt = "[object DataView]", At = "[object Float32Array]", pr = "[object Float64Array]", xn = "[object Int8Array]", wn = "[object Int16Array]", Ya = "[object Int32Array]", ma = "[object Uint8Array]", Mi = "[object Uint8ClampedArray]", Za = "[object Uint16Array]", Oo = "[object Uint32Array]", Ka = /\b__p \+= '';/g, un = /\b(__p \+=) '' \+/g, Ja = /(__e\(.*?\)|\b__t\)) \+\n'';/g, Lo = /&(?:amp|lt|gt|quot|#39);/g, Qa = /[&<>"']/g, Wl = RegExp(Lo.source), Bo = RegExp(Qa.source), Qs = /<%-([\s\S]+?)%>/g, Gl = /<%([\s\S]+?)%>/g, Ao = /<%=([\s\S]+?)%>/g, qo = /\.|\[(?:[^[\]]*|(["'])(?:(?!\1)[^\\]|\\.)*?\1)\]/, eu = /^\w*$/, Vl = /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|$))/g, jo = /[\\^$.*+?()[\]{}|]/g, he = RegExp(jo.source), ze = /^\s+/, De = /\s/, Oe = /\{(?:\n\/\* \[wrapped with .+\] \*\/)?\n?/, Be = /\{\n\/\* \[wrapped with (.+)\] \*/, ut = /,? & /, kt = /[^\x00-\x2f\x3a-\x40\x5b-\x60\x7b-\x7f]+/g, ce = /[()=,{}\[\]\/\s]/, ve = /\\(\\)?/g, Ce = /\$\{([^\\}]*(?:\\.[^\\}]*)*)\}/g, ft = /\w*$/, vt = /^[-+]0x[0-9a-f]+$/i, Rt = /^0b[01]+$/i, zt = /^\[object .+?Constructor\]$/, Xe = /^0o[0-7]+$/i, Tt = /^(?:0|[1-9]\d*)$/, cr = /[\xc0-\xd6\xd8-\xf6\xf8-\xff\u0100-\u017f]/g, zr = /($^)/, Mr = /['\n\r\u2028\u2029\\]/g, Jt = "\\ud800-\\udfff", ir = "\\u0300-\\u036f", Vr = "\\ufe20-\\ufe2f", $r = "\\u20d0-\\u20ff", Ur = ir + Vr + $r, Vi = "\\u2700-\\u27bf", Xl = "a-z\\xdf-\\xf6\\xf8-\\xff", vh = "\\xac\\xb1\\xd7\\xf7", ph = "\\x00-\\x2f\\x3a-\\x40\\x5b-\\x60\\x7b-\\xbf", Yl = "\\u2000-\\u206f", w3 = " \\t\\x0b\\f\\xa0\\ufeff\\n\\r\\u2028\\u2029\\u1680\\u180e\\u2000\\u2001\\u2002\\u2003\\u2004\\u2005\\u2006\\u2007\\u2008\\u2009\\u200a\\u202f\\u205f\\u3000", rm = "A-Z\\xc0-\\xd6\\xd8-\\xde", nm = "\\ufe0e\\ufe0f", im = vh + ph + Yl + w3, gh = "['’]", _3 = "[" + Jt + "]", am = "[" + im + "]", Pc = "[" + Ur + "]", om = "\\d+", k3 = "[" + Vi + "]", lm = "[" + Xl + "]", sm = "[^" + Jt + im + om + Vi + Xl + rm + "]", mh = "\\ud83c[\\udffb-\\udfff]", S3 = "(?:" + Pc + "|" + mh + ")", um = "[^" + Jt + "]", yh = "(?:\\ud83c[\\udde6-\\uddff]){2}", bh = "[\\ud800-\\udbff][\\udc00-\\udfff]", Zl = "[" + rm + "]", cm = "\\u200d", fm = "(?:" + lm + "|" + sm + ")", C3 = "(?:" + Zl + "|" + sm + ")", dm = "(?:" + gh + "(?:d|ll|m|re|s|t|ve))?", hm = "(?:" + gh + "(?:D|LL|M|RE|S|T|VE))?", vm = S3 + "?", pm = "[" + nm + "]?", E3 = "(?:" + cm + "(?:" + [um, yh, bh].join("|") + ")" + pm + vm + ")*", M3 = "\\d*(?:1st|2nd|3rd|(?![123])\\dth)(?=\\b|[A-Z_])", R3 = "\\d*(?:1ST|2ND|3RD|(?![123])\\dTH)(?=\\b|[a-z_])", gm = pm + vm + E3, T3 = "(?:" + [k3, yh, bh].join("|") + ")" + gm, N3 = "(?:" + [um + Pc + "?", Pc, yh, bh, _3].join("|") + ")", F3 = RegExp(gh, "g"), P3 = RegExp(Pc, "g"), xh = RegExp(mh + "(?=" + mh + ")|" + N3 + gm, "g"), z3 = RegExp([
        Zl + "?" + lm + "+" + dm + "(?=" + [am, Zl, "$"].join("|") + ")",
        C3 + "+" + hm + "(?=" + [am, Zl + fm, "$"].join("|") + ")",
        Zl + "?" + fm + "+" + dm,
        Zl + "+" + hm,
        R3,
        M3,
        om,
        T3
      ].join("|"), "g"), D3 = RegExp("[" + cm + Jt + Ur + nm + "]"), O3 = /[a-z][A-Z]|[A-Z]{2}[a-z]|[0-9][a-zA-Z]|[a-zA-Z][0-9]|[^a-zA-Z0-9 ]/, L3 = [
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
      ], B3 = -1, hr = {};
      hr[At] = hr[pr] = hr[xn] = hr[wn] = hr[Ya] = hr[ma] = hr[Mi] = hr[Za] = hr[Oo] = !0, hr[Se] = hr[xe] = hr[ur] = hr[Te] = hr[Bt] = hr[Re] = hr[ge] = hr[we] = hr[qe] = hr[Ve] = hr[dt] = hr[He] = hr[We] = hr[Mt] = hr[_t] = !1;
      var fr = {};
      fr[Se] = fr[xe] = fr[ur] = fr[Bt] = fr[Te] = fr[Re] = fr[At] = fr[pr] = fr[xn] = fr[wn] = fr[Ya] = fr[qe] = fr[Ve] = fr[dt] = fr[He] = fr[We] = fr[Mt] = fr[Ze] = fr[ma] = fr[Mi] = fr[Za] = fr[Oo] = !0, fr[ge] = fr[we] = fr[_t] = !1;
      var A3 = {
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
      }, q3 = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      }, j3 = {
        "&amp;": "&",
        "&lt;": "<",
        "&gt;": ">",
        "&quot;": '"',
        "&#39;": "'"
      }, $3 = {
        "\\": "\\",
        "'": "'",
        "\n": "n",
        "\r": "r",
        "\u2028": "u2028",
        "\u2029": "u2029"
      }, U3 = parseFloat, I3 = parseInt, mm = typeof mo == "object" && mo && mo.Object === Object && mo, H3 = typeof self == "object" && self && self.Object === Object && self, Xr = mm || H3 || Function("return this")(), wh = e && !e.nodeType && e, $o = wh && !0 && t && !t.nodeType && t, ym = $o && $o.exports === wh, _h = ym && mm.process, ni = function() {
        try {
          var J = $o && $o.require && $o.require("util").types;
          return J || _h && _h.binding && _h.binding("util");
        } catch {
        }
      }(), bm = ni && ni.isArrayBuffer, xm = ni && ni.isDate, wm = ni && ni.isMap, _m = ni && ni.isRegExp, km = ni && ni.isSet, Sm = ni && ni.isTypedArray;
      function jn(J, ue, ae) {
        switch (ae.length) {
          case 0:
            return J.call(ue);
          case 1:
            return J.call(ue, ae[0]);
          case 2:
            return J.call(ue, ae[0], ae[1]);
          case 3:
            return J.call(ue, ae[0], ae[1], ae[2]);
        }
        return J.apply(ue, ae);
      }
      function W3(J, ue, ae, Le) {
        for (var lt = -1, It = J == null ? 0 : J.length; ++lt < It; ) {
          var Ar = J[lt];
          ue(Le, Ar, ae(Ar), J);
        }
        return Le;
      }
      function ii(J, ue) {
        for (var ae = -1, Le = J == null ? 0 : J.length; ++ae < Le && ue(J[ae], ae, J) !== !1; )
          ;
        return J;
      }
      function G3(J, ue) {
        for (var ae = J == null ? 0 : J.length; ae-- && ue(J[ae], ae, J) !== !1; )
          ;
        return J;
      }
      function Cm(J, ue) {
        for (var ae = -1, Le = J == null ? 0 : J.length; ++ae < Le; )
          if (!ue(J[ae], ae, J))
            return !1;
        return !0;
      }
      function eo(J, ue) {
        for (var ae = -1, Le = J == null ? 0 : J.length, lt = 0, It = []; ++ae < Le; ) {
          var Ar = J[ae];
          ue(Ar, ae, J) && (It[lt++] = Ar);
        }
        return It;
      }
      function zc(J, ue) {
        var ae = J == null ? 0 : J.length;
        return !!ae && Kl(J, ue, 0) > -1;
      }
      function kh(J, ue, ae) {
        for (var Le = -1, lt = J == null ? 0 : J.length; ++Le < lt; )
          if (ae(ue, J[Le]))
            return !0;
        return !1;
      }
      function gr(J, ue) {
        for (var ae = -1, Le = J == null ? 0 : J.length, lt = Array(Le); ++ae < Le; )
          lt[ae] = ue(J[ae], ae, J);
        return lt;
      }
      function to(J, ue) {
        for (var ae = -1, Le = ue.length, lt = J.length; ++ae < Le; )
          J[lt + ae] = ue[ae];
        return J;
      }
      function Sh(J, ue, ae, Le) {
        var lt = -1, It = J == null ? 0 : J.length;
        for (Le && It && (ae = J[++lt]); ++lt < It; )
          ae = ue(ae, J[lt], lt, J);
        return ae;
      }
      function V3(J, ue, ae, Le) {
        var lt = J == null ? 0 : J.length;
        for (Le && lt && (ae = J[--lt]); lt--; )
          ae = ue(ae, J[lt], lt, J);
        return ae;
      }
      function Ch(J, ue) {
        for (var ae = -1, Le = J == null ? 0 : J.length; ++ae < Le; )
          if (ue(J[ae], ae, J))
            return !0;
        return !1;
      }
      var X3 = Eh("length");
      function Y3(J) {
        return J.split("");
      }
      function Z3(J) {
        return J.match(kt) || [];
      }
      function Em(J, ue, ae) {
        var Le;
        return ae(J, function(lt, It, Ar) {
          if (ue(lt, It, Ar))
            return Le = It, !1;
        }), Le;
      }
      function Dc(J, ue, ae, Le) {
        for (var lt = J.length, It = ae + (Le ? 1 : -1); Le ? It-- : ++It < lt; )
          if (ue(J[It], It, J))
            return It;
        return -1;
      }
      function Kl(J, ue, ae) {
        return ue === ue ? s5(J, ue, ae) : Dc(J, Mm, ae);
      }
      function K3(J, ue, ae, Le) {
        for (var lt = ae - 1, It = J.length; ++lt < It; )
          if (Le(J[lt], ue))
            return lt;
        return -1;
      }
      function Mm(J) {
        return J !== J;
      }
      function Rm(J, ue) {
        var ae = J == null ? 0 : J.length;
        return ae ? Rh(J, ue) / ae : U;
      }
      function Eh(J) {
        return function(ue) {
          return ue == null ? r : ue[J];
        };
      }
      function Mh(J) {
        return function(ue) {
          return J == null ? r : J[ue];
        };
      }
      function Tm(J, ue, ae, Le, lt) {
        return lt(J, function(It, Ar, lr) {
          ae = Le ? (Le = !1, It) : ue(ae, It, Ar, lr);
        }), ae;
      }
      function J3(J, ue) {
        var ae = J.length;
        for (J.sort(ue); ae--; )
          J[ae] = J[ae].value;
        return J;
      }
      function Rh(J, ue) {
        for (var ae, Le = -1, lt = J.length; ++Le < lt; ) {
          var It = ue(J[Le]);
          It !== r && (ae = ae === r ? It : ae + It);
        }
        return ae;
      }
      function Th(J, ue) {
        for (var ae = -1, Le = Array(J); ++ae < J; )
          Le[ae] = ue(ae);
        return Le;
      }
      function Q3(J, ue) {
        return gr(ue, function(ae) {
          return [ae, J[ae]];
        });
      }
      function Nm(J) {
        return J && J.slice(0, Dm(J) + 1).replace(ze, "");
      }
      function $n(J) {
        return function(ue) {
          return J(ue);
        };
      }
      function Nh(J, ue) {
        return gr(ue, function(ae) {
          return J[ae];
        });
      }
      function tu(J, ue) {
        return J.has(ue);
      }
      function Fm(J, ue) {
        for (var ae = -1, Le = J.length; ++ae < Le && Kl(ue, J[ae], 0) > -1; )
          ;
        return ae;
      }
      function Pm(J, ue) {
        for (var ae = J.length; ae-- && Kl(ue, J[ae], 0) > -1; )
          ;
        return ae;
      }
      function e5(J, ue) {
        for (var ae = J.length, Le = 0; ae--; )
          J[ae] === ue && ++Le;
        return Le;
      }
      var t5 = Mh(A3), r5 = Mh(q3);
      function n5(J) {
        return "\\" + $3[J];
      }
      function i5(J, ue) {
        return J == null ? r : J[ue];
      }
      function Jl(J) {
        return D3.test(J);
      }
      function a5(J) {
        return O3.test(J);
      }
      function o5(J) {
        for (var ue, ae = []; !(ue = J.next()).done; )
          ae.push(ue.value);
        return ae;
      }
      function Fh(J) {
        var ue = -1, ae = Array(J.size);
        return J.forEach(function(Le, lt) {
          ae[++ue] = [lt, Le];
        }), ae;
      }
      function zm(J, ue) {
        return function(ae) {
          return J(ue(ae));
        };
      }
      function ro(J, ue) {
        for (var ae = -1, Le = J.length, lt = 0, It = []; ++ae < Le; ) {
          var Ar = J[ae];
          (Ar === ue || Ar === h) && (J[ae] = h, It[lt++] = ae);
        }
        return It;
      }
      function Oc(J) {
        var ue = -1, ae = Array(J.size);
        return J.forEach(function(Le) {
          ae[++ue] = Le;
        }), ae;
      }
      function l5(J) {
        var ue = -1, ae = Array(J.size);
        return J.forEach(function(Le) {
          ae[++ue] = [Le, Le];
        }), ae;
      }
      function s5(J, ue, ae) {
        for (var Le = ae - 1, lt = J.length; ++Le < lt; )
          if (J[Le] === ue)
            return Le;
        return -1;
      }
      function u5(J, ue, ae) {
        for (var Le = ae + 1; Le--; )
          if (J[Le] === ue)
            return Le;
        return Le;
      }
      function Ql(J) {
        return Jl(J) ? f5(J) : X3(J);
      }
      function Ri(J) {
        return Jl(J) ? d5(J) : Y3(J);
      }
      function Dm(J) {
        for (var ue = J.length; ue-- && De.test(J.charAt(ue)); )
          ;
        return ue;
      }
      var c5 = Mh(j3);
      function f5(J) {
        for (var ue = xh.lastIndex = 0; xh.test(J); )
          ++ue;
        return ue;
      }
      function d5(J) {
        return J.match(xh) || [];
      }
      function h5(J) {
        return J.match(z3) || [];
      }
      var v5 = function J(ue) {
        ue = ue == null ? Xr : es.defaults(Xr.Object(), ue, es.pick(Xr, L3));
        var ae = ue.Array, Le = ue.Date, lt = ue.Error, It = ue.Function, Ar = ue.Math, lr = ue.Object, Ph = ue.RegExp, p5 = ue.String, ai = ue.TypeError, Lc = ae.prototype, g5 = It.prototype, ts = lr.prototype, Bc = ue["__core-js_shared__"], Ac = g5.toString, Qt = ts.hasOwnProperty, m5 = 0, Om = function() {
          var i = /[^.]+$/.exec(Bc && Bc.keys && Bc.keys.IE_PROTO || "");
          return i ? "Symbol(src)_1." + i : "";
        }(), qc = ts.toString, y5 = Ac.call(lr), b5 = Xr._, x5 = Ph(
          "^" + Ac.call(Qt).replace(jo, "\\$&").replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, "$1.*?") + "$"
        ), jc = ym ? ue.Buffer : r, no = ue.Symbol, $c = ue.Uint8Array, Lm = jc ? jc.allocUnsafe : r, Uc = zm(lr.getPrototypeOf, lr), Bm = lr.create, Am = ts.propertyIsEnumerable, Ic = Lc.splice, qm = no ? no.isConcatSpreadable : r, ru = no ? no.iterator : r, Uo = no ? no.toStringTag : r, Hc = function() {
          try {
            var i = Vo(lr, "defineProperty");
            return i({}, "", {}), i;
          } catch {
          }
        }(), w5 = ue.clearTimeout !== Xr.clearTimeout && ue.clearTimeout, _5 = Le && Le.now !== Xr.Date.now && Le.now, k5 = ue.setTimeout !== Xr.setTimeout && ue.setTimeout, Wc = Ar.ceil, Gc = Ar.floor, zh = lr.getOwnPropertySymbols, S5 = jc ? jc.isBuffer : r, jm = ue.isFinite, C5 = Lc.join, E5 = zm(lr.keys, lr), qr = Ar.max, Jr = Ar.min, M5 = Le.now, R5 = ue.parseInt, $m = Ar.random, T5 = Lc.reverse, Dh = Vo(ue, "DataView"), nu = Vo(ue, "Map"), Oh = Vo(ue, "Promise"), rs = Vo(ue, "Set"), iu = Vo(ue, "WeakMap"), au = Vo(lr, "create"), Vc = iu && new iu(), ns = {}, N5 = Xo(Dh), F5 = Xo(nu), P5 = Xo(Oh), z5 = Xo(rs), D5 = Xo(iu), Xc = no ? no.prototype : r, ou = Xc ? Xc.valueOf : r, Um = Xc ? Xc.toString : r;
        function F(i) {
          if (_r(i) && !ct(i) && !(i instanceof Nt)) {
            if (i instanceof oi)
              return i;
            if (Qt.call(i, "__wrapped__"))
              return I1(i);
          }
          return new oi(i);
        }
        var is = /* @__PURE__ */ function() {
          function i() {
          }
          return function(s) {
            if (!xr(s))
              return {};
            if (Bm)
              return Bm(s);
            i.prototype = s;
            var p = new i();
            return i.prototype = r, p;
          };
        }();
        function Yc() {
        }
        function oi(i, s) {
          this.__wrapped__ = i, this.__actions__ = [], this.__chain__ = !!s, this.__index__ = 0, this.__values__ = r;
        }
        F.templateSettings = {
          /**
           * Used to detect `data` property values to be HTML-escaped.
           *
           * @memberOf _.templateSettings
           * @type {RegExp}
           */
          escape: Qs,
          /**
           * Used to detect code to be evaluated.
           *
           * @memberOf _.templateSettings
           * @type {RegExp}
           */
          evaluate: Gl,
          /**
           * Used to detect `data` property values to inject.
           *
           * @memberOf _.templateSettings
           * @type {RegExp}
           */
          interpolate: Ao,
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
            _: F
          }
        }, F.prototype = Yc.prototype, F.prototype.constructor = F, oi.prototype = is(Yc.prototype), oi.prototype.constructor = oi;
        function Nt(i) {
          this.__wrapped__ = i, this.__actions__ = [], this.__dir__ = 1, this.__filtered__ = !1, this.__iteratees__ = [], this.__takeCount__ = Z, this.__views__ = [];
        }
        function O5() {
          var i = new Nt(this.__wrapped__);
          return i.__actions__ = _n(this.__actions__), i.__dir__ = this.__dir__, i.__filtered__ = this.__filtered__, i.__iteratees__ = _n(this.__iteratees__), i.__takeCount__ = this.__takeCount__, i.__views__ = _n(this.__views__), i;
        }
        function L5() {
          if (this.__filtered__) {
            var i = new Nt(this);
            i.__dir__ = -1, i.__filtered__ = !0;
          } else
            i = this.clone(), i.__dir__ *= -1;
          return i;
        }
        function B5() {
          var i = this.__wrapped__.value(), s = this.__dir__, p = ct(i), b = s < 0, C = p ? i.length : 0, P = Y4(0, C, this.__views__), A = P.start, I = P.end, re = I - A, fe = b ? I : A - 1, de = this.__iteratees__, be = de.length, Pe = 0, Ue = Jr(re, this.__takeCount__);
          if (!p || !b && C == re && Ue == re)
            return d1(i, this.__actions__);
          var Je = [];
          e:
            for (; re-- && Pe < Ue; ) {
              fe += s;
              for (var pt = -1, Qe = i[fe]; ++pt < be; ) {
                var St = de[pt], Dt = St.iteratee, Hn = St.type, dn = Dt(Qe);
                if (Hn == Y)
                  Qe = dn;
                else if (!dn) {
                  if (Hn == W)
                    continue e;
                  break e;
                }
              }
              Je[Pe++] = Qe;
            }
          return Je;
        }
        Nt.prototype = is(Yc.prototype), Nt.prototype.constructor = Nt;
        function Io(i) {
          var s = -1, p = i == null ? 0 : i.length;
          for (this.clear(); ++s < p; ) {
            var b = i[s];
            this.set(b[0], b[1]);
          }
        }
        function A5() {
          this.__data__ = au ? au(null) : {}, this.size = 0;
        }
        function q5(i) {
          var s = this.has(i) && delete this.__data__[i];
          return this.size -= s ? 1 : 0, s;
        }
        function j5(i) {
          var s = this.__data__;
          if (au) {
            var p = s[i];
            return p === c ? r : p;
          }
          return Qt.call(s, i) ? s[i] : r;
        }
        function $5(i) {
          var s = this.__data__;
          return au ? s[i] !== r : Qt.call(s, i);
        }
        function U5(i, s) {
          var p = this.__data__;
          return this.size += this.has(i) ? 0 : 1, p[i] = au && s === r ? c : s, this;
        }
        Io.prototype.clear = A5, Io.prototype.delete = q5, Io.prototype.get = j5, Io.prototype.has = $5, Io.prototype.set = U5;
        function ya(i) {
          var s = -1, p = i == null ? 0 : i.length;
          for (this.clear(); ++s < p; ) {
            var b = i[s];
            this.set(b[0], b[1]);
          }
        }
        function I5() {
          this.__data__ = [], this.size = 0;
        }
        function H5(i) {
          var s = this.__data__, p = Zc(s, i);
          if (p < 0)
            return !1;
          var b = s.length - 1;
          return p == b ? s.pop() : Ic.call(s, p, 1), --this.size, !0;
        }
        function W5(i) {
          var s = this.__data__, p = Zc(s, i);
          return p < 0 ? r : s[p][1];
        }
        function G5(i) {
          return Zc(this.__data__, i) > -1;
        }
        function V5(i, s) {
          var p = this.__data__, b = Zc(p, i);
          return b < 0 ? (++this.size, p.push([i, s])) : p[b][1] = s, this;
        }
        ya.prototype.clear = I5, ya.prototype.delete = H5, ya.prototype.get = W5, ya.prototype.has = G5, ya.prototype.set = V5;
        function ba(i) {
          var s = -1, p = i == null ? 0 : i.length;
          for (this.clear(); ++s < p; ) {
            var b = i[s];
            this.set(b[0], b[1]);
          }
        }
        function X5() {
          this.size = 0, this.__data__ = {
            hash: new Io(),
            map: new (nu || ya)(),
            string: new Io()
          };
        }
        function Y5(i) {
          var s = uf(this, i).delete(i);
          return this.size -= s ? 1 : 0, s;
        }
        function Z5(i) {
          return uf(this, i).get(i);
        }
        function K5(i) {
          return uf(this, i).has(i);
        }
        function J5(i, s) {
          var p = uf(this, i), b = p.size;
          return p.set(i, s), this.size += p.size == b ? 0 : 1, this;
        }
        ba.prototype.clear = X5, ba.prototype.delete = Y5, ba.prototype.get = Z5, ba.prototype.has = K5, ba.prototype.set = J5;
        function Ho(i) {
          var s = -1, p = i == null ? 0 : i.length;
          for (this.__data__ = new ba(); ++s < p; )
            this.add(i[s]);
        }
        function Q5(i) {
          return this.__data__.set(i, c), this;
        }
        function e4(i) {
          return this.__data__.has(i);
        }
        Ho.prototype.add = Ho.prototype.push = Q5, Ho.prototype.has = e4;
        function Ti(i) {
          var s = this.__data__ = new ya(i);
          this.size = s.size;
        }
        function t4() {
          this.__data__ = new ya(), this.size = 0;
        }
        function r4(i) {
          var s = this.__data__, p = s.delete(i);
          return this.size = s.size, p;
        }
        function n4(i) {
          return this.__data__.get(i);
        }
        function i4(i) {
          return this.__data__.has(i);
        }
        function a4(i, s) {
          var p = this.__data__;
          if (p instanceof ya) {
            var b = p.__data__;
            if (!nu || b.length < a - 1)
              return b.push([i, s]), this.size = ++p.size, this;
            p = this.__data__ = new ba(b);
          }
          return p.set(i, s), this.size = p.size, this;
        }
        Ti.prototype.clear = t4, Ti.prototype.delete = r4, Ti.prototype.get = n4, Ti.prototype.has = i4, Ti.prototype.set = a4;
        function Im(i, s) {
          var p = ct(i), b = !p && Yo(i), C = !p && !b && so(i), P = !p && !b && !C && ss(i), A = p || b || C || P, I = A ? Th(i.length, p5) : [], re = I.length;
          for (var fe in i)
            (s || Qt.call(i, fe)) && !(A && // Safari 9 has enumerable `arguments.length` in strict mode.
            (fe == "length" || // Node.js 0.10 has enumerable non-index properties on buffers.
            C && (fe == "offset" || fe == "parent") || // PhantomJS 2 has enumerable non-index properties on typed arrays.
            P && (fe == "buffer" || fe == "byteLength" || fe == "byteOffset") || // Skip index properties.
            ka(fe, re))) && I.push(fe);
          return I;
        }
        function Hm(i) {
          var s = i.length;
          return s ? i[Gh(0, s - 1)] : r;
        }
        function o4(i, s) {
          return cf(_n(i), Wo(s, 0, i.length));
        }
        function l4(i) {
          return cf(_n(i));
        }
        function Lh(i, s, p) {
          (p !== r && !Ni(i[s], p) || p === r && !(s in i)) && xa(i, s, p);
        }
        function lu(i, s, p) {
          var b = i[s];
          (!(Qt.call(i, s) && Ni(b, p)) || p === r && !(s in i)) && xa(i, s, p);
        }
        function Zc(i, s) {
          for (var p = i.length; p--; )
            if (Ni(i[p][0], s))
              return p;
          return -1;
        }
        function s4(i, s, p, b) {
          return io(i, function(C, P, A) {
            s(b, C, p(C), A);
          }), b;
        }
        function Wm(i, s) {
          return i && Yi(s, Ir(s), i);
        }
        function u4(i, s) {
          return i && Yi(s, Sn(s), i);
        }
        function xa(i, s, p) {
          s == "__proto__" && Hc ? Hc(i, s, {
            configurable: !0,
            enumerable: !0,
            value: p,
            writable: !0
          }) : i[s] = p;
        }
        function Bh(i, s) {
          for (var p = -1, b = s.length, C = ae(b), P = i == null; ++p < b; )
            C[p] = P ? r : m0(i, s[p]);
          return C;
        }
        function Wo(i, s, p) {
          return i === i && (p !== r && (i = i <= p ? i : p), s !== r && (i = i >= s ? i : s)), i;
        }
        function li(i, s, p, b, C, P) {
          var A, I = s & d, re = s & g, fe = s & m;
          if (p && (A = C ? p(i, b, C, P) : p(i)), A !== r)
            return A;
          if (!xr(i))
            return i;
          var de = ct(i);
          if (de) {
            if (A = K4(i), !I)
              return _n(i, A);
          } else {
            var be = Qr(i), Pe = be == we || be == $e;
            if (so(i))
              return p1(i, I);
            if (be == dt || be == Se || Pe && !C) {
              if (A = re || Pe ? {} : D1(i), !I)
                return re ? j4(i, u4(A, i)) : q4(i, Wm(A, i));
            } else {
              if (!fr[be])
                return C ? i : {};
              A = J4(i, be, I);
            }
          }
          P || (P = new Ti());
          var Ue = P.get(i);
          if (Ue)
            return Ue;
          P.set(i, A), uy(i) ? i.forEach(function(Qe) {
            A.add(li(Qe, s, p, Qe, i, P));
          }) : ly(i) && i.forEach(function(Qe, St) {
            A.set(St, li(Qe, s, p, St, i, P));
          });
          var Je = fe ? re ? n0 : r0 : re ? Sn : Ir, pt = de ? r : Je(i);
          return ii(pt || i, function(Qe, St) {
            pt && (St = Qe, Qe = i[St]), lu(A, St, li(Qe, s, p, St, i, P));
          }), A;
        }
        function c4(i) {
          var s = Ir(i);
          return function(p) {
            return Gm(p, i, s);
          };
        }
        function Gm(i, s, p) {
          var b = p.length;
          if (i == null)
            return !b;
          for (i = lr(i); b--; ) {
            var C = p[b], P = s[C], A = i[C];
            if (A === r && !(C in i) || !P(A))
              return !1;
          }
          return !0;
        }
        function Vm(i, s, p) {
          if (typeof i != "function")
            throw new ai(l);
          return vu(function() {
            i.apply(r, p);
          }, s);
        }
        function su(i, s, p, b) {
          var C = -1, P = zc, A = !0, I = i.length, re = [], fe = s.length;
          if (!I)
            return re;
          p && (s = gr(s, $n(p))), b ? (P = kh, A = !1) : s.length >= a && (P = tu, A = !1, s = new Ho(s));
          e:
            for (; ++C < I; ) {
              var de = i[C], be = p == null ? de : p(de);
              if (de = b || de !== 0 ? de : 0, A && be === be) {
                for (var Pe = fe; Pe--; )
                  if (s[Pe] === be)
                    continue e;
                re.push(de);
              } else P(s, be, b) || re.push(de);
            }
          return re;
        }
        var io = x1(Xi), Xm = x1(qh, !0);
        function f4(i, s) {
          var p = !0;
          return io(i, function(b, C, P) {
            return p = !!s(b, C, P), p;
          }), p;
        }
        function Kc(i, s, p) {
          for (var b = -1, C = i.length; ++b < C; ) {
            var P = i[b], A = s(P);
            if (A != null && (I === r ? A === A && !In(A) : p(A, I)))
              var I = A, re = P;
          }
          return re;
        }
        function d4(i, s, p, b) {
          var C = i.length;
          for (p = ht(p), p < 0 && (p = -p > C ? 0 : C + p), b = b === r || b > C ? C : ht(b), b < 0 && (b += C), b = p > b ? 0 : fy(b); p < b; )
            i[p++] = s;
          return i;
        }
        function Ym(i, s) {
          var p = [];
          return io(i, function(b, C, P) {
            s(b, C, P) && p.push(b);
          }), p;
        }
        function Yr(i, s, p, b, C) {
          var P = -1, A = i.length;
          for (p || (p = e6), C || (C = []); ++P < A; ) {
            var I = i[P];
            s > 0 && p(I) ? s > 1 ? Yr(I, s - 1, p, b, C) : to(C, I) : b || (C[C.length] = I);
          }
          return C;
        }
        var Ah = w1(), Zm = w1(!0);
        function Xi(i, s) {
          return i && Ah(i, s, Ir);
        }
        function qh(i, s) {
          return i && Zm(i, s, Ir);
        }
        function Jc(i, s) {
          return eo(s, function(p) {
            return Sa(i[p]);
          });
        }
        function Go(i, s) {
          s = oo(s, i);
          for (var p = 0, b = s.length; i != null && p < b; )
            i = i[Zi(s[p++])];
          return p && p == b ? i : r;
        }
        function Km(i, s, p) {
          var b = s(i);
          return ct(i) ? b : to(b, p(i));
        }
        function cn(i) {
          return i == null ? i === r ? Ut : rt : Uo && Uo in lr(i) ? X4(i) : l6(i);
        }
        function jh(i, s) {
          return i > s;
        }
        function h4(i, s) {
          return i != null && Qt.call(i, s);
        }
        function v4(i, s) {
          return i != null && s in lr(i);
        }
        function p4(i, s, p) {
          return i >= Jr(s, p) && i < qr(s, p);
        }
        function $h(i, s, p) {
          for (var b = p ? kh : zc, C = i[0].length, P = i.length, A = P, I = ae(P), re = 1 / 0, fe = []; A--; ) {
            var de = i[A];
            A && s && (de = gr(de, $n(s))), re = Jr(de.length, re), I[A] = !p && (s || C >= 120 && de.length >= 120) ? new Ho(A && de) : r;
          }
          de = i[0];
          var be = -1, Pe = I[0];
          e:
            for (; ++be < C && fe.length < re; ) {
              var Ue = de[be], Je = s ? s(Ue) : Ue;
              if (Ue = p || Ue !== 0 ? Ue : 0, !(Pe ? tu(Pe, Je) : b(fe, Je, p))) {
                for (A = P; --A; ) {
                  var pt = I[A];
                  if (!(pt ? tu(pt, Je) : b(i[A], Je, p)))
                    continue e;
                }
                Pe && Pe.push(Je), fe.push(Ue);
              }
            }
          return fe;
        }
        function g4(i, s, p, b) {
          return Xi(i, function(C, P, A) {
            s(b, p(C), P, A);
          }), b;
        }
        function uu(i, s, p) {
          s = oo(s, i), i = A1(i, s);
          var b = i == null ? i : i[Zi(ui(s))];
          return b == null ? r : jn(b, i, p);
        }
        function Jm(i) {
          return _r(i) && cn(i) == Se;
        }
        function m4(i) {
          return _r(i) && cn(i) == ur;
        }
        function y4(i) {
          return _r(i) && cn(i) == Re;
        }
        function cu(i, s, p, b, C) {
          return i === s ? !0 : i == null || s == null || !_r(i) && !_r(s) ? i !== i && s !== s : b4(i, s, p, b, cu, C);
        }
        function b4(i, s, p, b, C, P) {
          var A = ct(i), I = ct(s), re = A ? xe : Qr(i), fe = I ? xe : Qr(s);
          re = re == Se ? dt : re, fe = fe == Se ? dt : fe;
          var de = re == dt, be = fe == dt, Pe = re == fe;
          if (Pe && so(i)) {
            if (!so(s))
              return !1;
            A = !0, de = !1;
          }
          if (Pe && !de)
            return P || (P = new Ti()), A || ss(i) ? F1(i, s, p, b, C, P) : G4(i, s, re, p, b, C, P);
          if (!(p & y)) {
            var Ue = de && Qt.call(i, "__wrapped__"), Je = be && Qt.call(s, "__wrapped__");
            if (Ue || Je) {
              var pt = Ue ? i.value() : i, Qe = Je ? s.value() : s;
              return P || (P = new Ti()), C(pt, Qe, p, b, P);
            }
          }
          return Pe ? (P || (P = new Ti()), V4(i, s, p, b, C, P)) : !1;
        }
        function x4(i) {
          return _r(i) && Qr(i) == qe;
        }
        function Uh(i, s, p, b) {
          var C = p.length, P = C, A = !b;
          if (i == null)
            return !P;
          for (i = lr(i); C--; ) {
            var I = p[C];
            if (A && I[2] ? I[1] !== i[I[0]] : !(I[0] in i))
              return !1;
          }
          for (; ++C < P; ) {
            I = p[C];
            var re = I[0], fe = i[re], de = I[1];
            if (A && I[2]) {
              if (fe === r && !(re in i))
                return !1;
            } else {
              var be = new Ti();
              if (b)
                var Pe = b(fe, de, re, i, s, be);
              if (!(Pe === r ? cu(de, fe, y | w, b, be) : Pe))
                return !1;
            }
          }
          return !0;
        }
        function Qm(i) {
          if (!xr(i) || r6(i))
            return !1;
          var s = Sa(i) ? x5 : zt;
          return s.test(Xo(i));
        }
        function w4(i) {
          return _r(i) && cn(i) == He;
        }
        function _4(i) {
          return _r(i) && Qr(i) == We;
        }
        function k4(i) {
          return _r(i) && gf(i.length) && !!hr[cn(i)];
        }
        function e1(i) {
          return typeof i == "function" ? i : i == null ? Cn : typeof i == "object" ? ct(i) ? n1(i[0], i[1]) : r1(i) : _y(i);
        }
        function Ih(i) {
          if (!hu(i))
            return E5(i);
          var s = [];
          for (var p in lr(i))
            Qt.call(i, p) && p != "constructor" && s.push(p);
          return s;
        }
        function S4(i) {
          if (!xr(i))
            return o6(i);
          var s = hu(i), p = [];
          for (var b in i)
            b == "constructor" && (s || !Qt.call(i, b)) || p.push(b);
          return p;
        }
        function Hh(i, s) {
          return i < s;
        }
        function t1(i, s) {
          var p = -1, b = kn(i) ? ae(i.length) : [];
          return io(i, function(C, P, A) {
            b[++p] = s(C, P, A);
          }), b;
        }
        function r1(i) {
          var s = a0(i);
          return s.length == 1 && s[0][2] ? L1(s[0][0], s[0][1]) : function(p) {
            return p === i || Uh(p, i, s);
          };
        }
        function n1(i, s) {
          return l0(i) && O1(s) ? L1(Zi(i), s) : function(p) {
            var b = m0(p, i);
            return b === r && b === s ? y0(p, i) : cu(s, b, y | w);
          };
        }
        function Qc(i, s, p, b, C) {
          i !== s && Ah(s, function(P, A) {
            if (C || (C = new Ti()), xr(P))
              C4(i, s, A, p, Qc, b, C);
            else {
              var I = b ? b(u0(i, A), P, A + "", i, s, C) : r;
              I === r && (I = P), Lh(i, A, I);
            }
          }, Sn);
        }
        function C4(i, s, p, b, C, P, A) {
          var I = u0(i, p), re = u0(s, p), fe = A.get(re);
          if (fe) {
            Lh(i, p, fe);
            return;
          }
          var de = P ? P(I, re, p + "", i, s, A) : r, be = de === r;
          if (be) {
            var Pe = ct(re), Ue = !Pe && so(re), Je = !Pe && !Ue && ss(re);
            de = re, Pe || Ue || Je ? ct(I) ? de = I : Rr(I) ? de = _n(I) : Ue ? (be = !1, de = p1(re, !0)) : Je ? (be = !1, de = g1(re, !0)) : de = [] : pu(re) || Yo(re) ? (de = I, Yo(I) ? de = dy(I) : (!xr(I) || Sa(I)) && (de = D1(re))) : be = !1;
          }
          be && (A.set(re, de), C(de, re, b, P, A), A.delete(re)), Lh(i, p, de);
        }
        function i1(i, s) {
          var p = i.length;
          if (p)
            return s += s < 0 ? p : 0, ka(s, p) ? i[s] : r;
        }
        function a1(i, s, p) {
          s.length ? s = gr(s, function(P) {
            return ct(P) ? function(A) {
              return Go(A, P.length === 1 ? P[0] : P);
            } : P;
          }) : s = [Cn];
          var b = -1;
          s = gr(s, $n(Ke()));
          var C = t1(i, function(P, A, I) {
            var re = gr(s, function(fe) {
              return fe(P);
            });
            return { criteria: re, index: ++b, value: P };
          });
          return J3(C, function(P, A) {
            return A4(P, A, p);
          });
        }
        function E4(i, s) {
          return o1(i, s, function(p, b) {
            return y0(i, b);
          });
        }
        function o1(i, s, p) {
          for (var b = -1, C = s.length, P = {}; ++b < C; ) {
            var A = s[b], I = Go(i, A);
            p(I, A) && fu(P, oo(A, i), I);
          }
          return P;
        }
        function M4(i) {
          return function(s) {
            return Go(s, i);
          };
        }
        function Wh(i, s, p, b) {
          var C = b ? K3 : Kl, P = -1, A = s.length, I = i;
          for (i === s && (s = _n(s)), p && (I = gr(i, $n(p))); ++P < A; )
            for (var re = 0, fe = s[P], de = p ? p(fe) : fe; (re = C(I, de, re, b)) > -1; )
              I !== i && Ic.call(I, re, 1), Ic.call(i, re, 1);
          return i;
        }
        function l1(i, s) {
          for (var p = i ? s.length : 0, b = p - 1; p--; ) {
            var C = s[p];
            if (p == b || C !== P) {
              var P = C;
              ka(C) ? Ic.call(i, C, 1) : Yh(i, C);
            }
          }
          return i;
        }
        function Gh(i, s) {
          return i + Gc($m() * (s - i + 1));
        }
        function R4(i, s, p, b) {
          for (var C = -1, P = qr(Wc((s - i) / (p || 1)), 0), A = ae(P); P--; )
            A[b ? P : ++C] = i, i += p;
          return A;
        }
        function Vh(i, s) {
          var p = "";
          if (!i || s < 1 || s > K)
            return p;
          do
            s % 2 && (p += i), s = Gc(s / 2), s && (i += i);
          while (s);
          return p;
        }
        function bt(i, s) {
          return c0(B1(i, s, Cn), i + "");
        }
        function T4(i) {
          return Hm(us(i));
        }
        function N4(i, s) {
          var p = us(i);
          return cf(p, Wo(s, 0, p.length));
        }
        function fu(i, s, p, b) {
          if (!xr(i))
            return i;
          s = oo(s, i);
          for (var C = -1, P = s.length, A = P - 1, I = i; I != null && ++C < P; ) {
            var re = Zi(s[C]), fe = p;
            if (re === "__proto__" || re === "constructor" || re === "prototype")
              return i;
            if (C != A) {
              var de = I[re];
              fe = b ? b(de, re, I) : r, fe === r && (fe = xr(de) ? de : ka(s[C + 1]) ? [] : {});
            }
            lu(I, re, fe), I = I[re];
          }
          return i;
        }
        var s1 = Vc ? function(i, s) {
          return Vc.set(i, s), i;
        } : Cn, F4 = Hc ? function(i, s) {
          return Hc(i, "toString", {
            configurable: !0,
            enumerable: !1,
            value: x0(s),
            writable: !0
          });
        } : Cn;
        function P4(i) {
          return cf(us(i));
        }
        function si(i, s, p) {
          var b = -1, C = i.length;
          s < 0 && (s = -s > C ? 0 : C + s), p = p > C ? C : p, p < 0 && (p += C), C = s > p ? 0 : p - s >>> 0, s >>>= 0;
          for (var P = ae(C); ++b < C; )
            P[b] = i[b + s];
          return P;
        }
        function z4(i, s) {
          var p;
          return io(i, function(b, C, P) {
            return p = s(b, C, P), !p;
          }), !!p;
        }
        function ef(i, s, p) {
          var b = 0, C = i == null ? b : i.length;
          if (typeof s == "number" && s === s && C <= se) {
            for (; b < C; ) {
              var P = b + C >>> 1, A = i[P];
              A !== null && !In(A) && (p ? A <= s : A < s) ? b = P + 1 : C = P;
            }
            return C;
          }
          return Xh(i, s, Cn, p);
        }
        function Xh(i, s, p, b) {
          var C = 0, P = i == null ? 0 : i.length;
          if (P === 0)
            return 0;
          s = p(s);
          for (var A = s !== s, I = s === null, re = In(s), fe = s === r; C < P; ) {
            var de = Gc((C + P) / 2), be = p(i[de]), Pe = be !== r, Ue = be === null, Je = be === be, pt = In(be);
            if (A)
              var Qe = b || Je;
            else fe ? Qe = Je && (b || Pe) : I ? Qe = Je && Pe && (b || !Ue) : re ? Qe = Je && Pe && !Ue && (b || !pt) : Ue || pt ? Qe = !1 : Qe = b ? be <= s : be < s;
            Qe ? C = de + 1 : P = de;
          }
          return Jr(P, le);
        }
        function u1(i, s) {
          for (var p = -1, b = i.length, C = 0, P = []; ++p < b; ) {
            var A = i[p], I = s ? s(A) : A;
            if (!p || !Ni(I, re)) {
              var re = I;
              P[C++] = A === 0 ? 0 : A;
            }
          }
          return P;
        }
        function c1(i) {
          return typeof i == "number" ? i : In(i) ? U : +i;
        }
        function Un(i) {
          if (typeof i == "string")
            return i;
          if (ct(i))
            return gr(i, Un) + "";
          if (In(i))
            return Um ? Um.call(i) : "";
          var s = i + "";
          return s == "0" && 1 / i == -X ? "-0" : s;
        }
        function ao(i, s, p) {
          var b = -1, C = zc, P = i.length, A = !0, I = [], re = I;
          if (p)
            A = !1, C = kh;
          else if (P >= a) {
            var fe = s ? null : H4(i);
            if (fe)
              return Oc(fe);
            A = !1, C = tu, re = new Ho();
          } else
            re = s ? [] : I;
          e:
            for (; ++b < P; ) {
              var de = i[b], be = s ? s(de) : de;
              if (de = p || de !== 0 ? de : 0, A && be === be) {
                for (var Pe = re.length; Pe--; )
                  if (re[Pe] === be)
                    continue e;
                s && re.push(be), I.push(de);
              } else C(re, be, p) || (re !== I && re.push(be), I.push(de));
            }
          return I;
        }
        function Yh(i, s) {
          return s = oo(s, i), i = A1(i, s), i == null || delete i[Zi(ui(s))];
        }
        function f1(i, s, p, b) {
          return fu(i, s, p(Go(i, s)), b);
        }
        function tf(i, s, p, b) {
          for (var C = i.length, P = b ? C : -1; (b ? P-- : ++P < C) && s(i[P], P, i); )
            ;
          return p ? si(i, b ? 0 : P, b ? P + 1 : C) : si(i, b ? P + 1 : 0, b ? C : P);
        }
        function d1(i, s) {
          var p = i;
          return p instanceof Nt && (p = p.value()), Sh(s, function(b, C) {
            return C.func.apply(C.thisArg, to([b], C.args));
          }, p);
        }
        function Zh(i, s, p) {
          var b = i.length;
          if (b < 2)
            return b ? ao(i[0]) : [];
          for (var C = -1, P = ae(b); ++C < b; )
            for (var A = i[C], I = -1; ++I < b; )
              I != C && (P[C] = su(P[C] || A, i[I], s, p));
          return ao(Yr(P, 1), s, p);
        }
        function h1(i, s, p) {
          for (var b = -1, C = i.length, P = s.length, A = {}; ++b < C; ) {
            var I = b < P ? s[b] : r;
            p(A, i[b], I);
          }
          return A;
        }
        function Kh(i) {
          return Rr(i) ? i : [];
        }
        function Jh(i) {
          return typeof i == "function" ? i : Cn;
        }
        function oo(i, s) {
          return ct(i) ? i : l0(i, s) ? [i] : U1(Vt(i));
        }
        var D4 = bt;
        function lo(i, s, p) {
          var b = i.length;
          return p = p === r ? b : p, !s && p >= b ? i : si(i, s, p);
        }
        var v1 = w5 || function(i) {
          return Xr.clearTimeout(i);
        };
        function p1(i, s) {
          if (s)
            return i.slice();
          var p = i.length, b = Lm ? Lm(p) : new i.constructor(p);
          return i.copy(b), b;
        }
        function Qh(i) {
          var s = new i.constructor(i.byteLength);
          return new $c(s).set(new $c(i)), s;
        }
        function O4(i, s) {
          var p = s ? Qh(i.buffer) : i.buffer;
          return new i.constructor(p, i.byteOffset, i.byteLength);
        }
        function L4(i) {
          var s = new i.constructor(i.source, ft.exec(i));
          return s.lastIndex = i.lastIndex, s;
        }
        function B4(i) {
          return ou ? lr(ou.call(i)) : {};
        }
        function g1(i, s) {
          var p = s ? Qh(i.buffer) : i.buffer;
          return new i.constructor(p, i.byteOffset, i.length);
        }
        function m1(i, s) {
          if (i !== s) {
            var p = i !== r, b = i === null, C = i === i, P = In(i), A = s !== r, I = s === null, re = s === s, fe = In(s);
            if (!I && !fe && !P && i > s || P && A && re && !I && !fe || b && A && re || !p && re || !C)
              return 1;
            if (!b && !P && !fe && i < s || fe && p && C && !b && !P || I && p && C || !A && C || !re)
              return -1;
          }
          return 0;
        }
        function A4(i, s, p) {
          for (var b = -1, C = i.criteria, P = s.criteria, A = C.length, I = p.length; ++b < A; ) {
            var re = m1(C[b], P[b]);
            if (re) {
              if (b >= I)
                return re;
              var fe = p[b];
              return re * (fe == "desc" ? -1 : 1);
            }
          }
          return i.index - s.index;
        }
        function y1(i, s, p, b) {
          for (var C = -1, P = i.length, A = p.length, I = -1, re = s.length, fe = qr(P - A, 0), de = ae(re + fe), be = !b; ++I < re; )
            de[I] = s[I];
          for (; ++C < A; )
            (be || C < P) && (de[p[C]] = i[C]);
          for (; fe--; )
            de[I++] = i[C++];
          return de;
        }
        function b1(i, s, p, b) {
          for (var C = -1, P = i.length, A = -1, I = p.length, re = -1, fe = s.length, de = qr(P - I, 0), be = ae(de + fe), Pe = !b; ++C < de; )
            be[C] = i[C];
          for (var Ue = C; ++re < fe; )
            be[Ue + re] = s[re];
          for (; ++A < I; )
            (Pe || C < P) && (be[Ue + p[A]] = i[C++]);
          return be;
        }
        function _n(i, s) {
          var p = -1, b = i.length;
          for (s || (s = ae(b)); ++p < b; )
            s[p] = i[p];
          return s;
        }
        function Yi(i, s, p, b) {
          var C = !p;
          p || (p = {});
          for (var P = -1, A = s.length; ++P < A; ) {
            var I = s[P], re = b ? b(p[I], i[I], I, p, i) : r;
            re === r && (re = i[I]), C ? xa(p, I, re) : lu(p, I, re);
          }
          return p;
        }
        function q4(i, s) {
          return Yi(i, o0(i), s);
        }
        function j4(i, s) {
          return Yi(i, P1(i), s);
        }
        function rf(i, s) {
          return function(p, b) {
            var C = ct(p) ? W3 : s4, P = s ? s() : {};
            return C(p, i, Ke(b, 2), P);
          };
        }
        function as(i) {
          return bt(function(s, p) {
            var b = -1, C = p.length, P = C > 1 ? p[C - 1] : r, A = C > 2 ? p[2] : r;
            for (P = i.length > 3 && typeof P == "function" ? (C--, P) : r, A && fn(p[0], p[1], A) && (P = C < 3 ? r : P, C = 1), s = lr(s); ++b < C; ) {
              var I = p[b];
              I && i(s, I, b, P);
            }
            return s;
          });
        }
        function x1(i, s) {
          return function(p, b) {
            if (p == null)
              return p;
            if (!kn(p))
              return i(p, b);
            for (var C = p.length, P = s ? C : -1, A = lr(p); (s ? P-- : ++P < C) && b(A[P], P, A) !== !1; )
              ;
            return p;
          };
        }
        function w1(i) {
          return function(s, p, b) {
            for (var C = -1, P = lr(s), A = b(s), I = A.length; I--; ) {
              var re = A[i ? I : ++C];
              if (p(P[re], re, P) === !1)
                break;
            }
            return s;
          };
        }
        function $4(i, s, p) {
          var b = s & x, C = du(i);
          function P() {
            var A = this && this !== Xr && this instanceof P ? C : i;
            return A.apply(b ? p : this, arguments);
          }
          return P;
        }
        function _1(i) {
          return function(s) {
            s = Vt(s);
            var p = Jl(s) ? Ri(s) : r, b = p ? p[0] : s.charAt(0), C = p ? lo(p, 1).join("") : s.slice(1);
            return b[i]() + C;
          };
        }
        function os(i) {
          return function(s) {
            return Sh(xy(by(s).replace(F3, "")), i, "");
          };
        }
        function du(i) {
          return function() {
            var s = arguments;
            switch (s.length) {
              case 0:
                return new i();
              case 1:
                return new i(s[0]);
              case 2:
                return new i(s[0], s[1]);
              case 3:
                return new i(s[0], s[1], s[2]);
              case 4:
                return new i(s[0], s[1], s[2], s[3]);
              case 5:
                return new i(s[0], s[1], s[2], s[3], s[4]);
              case 6:
                return new i(s[0], s[1], s[2], s[3], s[4], s[5]);
              case 7:
                return new i(s[0], s[1], s[2], s[3], s[4], s[5], s[6]);
            }
            var p = is(i.prototype), b = i.apply(p, s);
            return xr(b) ? b : p;
          };
        }
        function U4(i, s, p) {
          var b = du(i);
          function C() {
            for (var P = arguments.length, A = ae(P), I = P, re = ls(C); I--; )
              A[I] = arguments[I];
            var fe = P < 3 && A[0] !== re && A[P - 1] !== re ? [] : ro(A, re);
            if (P -= fe.length, P < p)
              return M1(
                i,
                s,
                nf,
                C.placeholder,
                r,
                A,
                fe,
                r,
                r,
                p - P
              );
            var de = this && this !== Xr && this instanceof C ? b : i;
            return jn(de, this, A);
          }
          return C;
        }
        function k1(i) {
          return function(s, p, b) {
            var C = lr(s);
            if (!kn(s)) {
              var P = Ke(p, 3);
              s = Ir(s), p = function(I) {
                return P(C[I], I, C);
              };
            }
            var A = i(s, p, b);
            return A > -1 ? C[P ? s[A] : A] : r;
          };
        }
        function S1(i) {
          return _a(function(s) {
            var p = s.length, b = p, C = oi.prototype.thru;
            for (i && s.reverse(); b--; ) {
              var P = s[b];
              if (typeof P != "function")
                throw new ai(l);
              if (C && !A && sf(P) == "wrapper")
                var A = new oi([], !0);
            }
            for (b = A ? b : p; ++b < p; ) {
              P = s[b];
              var I = sf(P), re = I == "wrapper" ? i0(P) : r;
              re && s0(re[0]) && re[1] == (R | k | E | z) && !re[4].length && re[9] == 1 ? A = A[sf(re[0])].apply(A, re[3]) : A = P.length == 1 && s0(P) ? A[I]() : A.thru(P);
            }
            return function() {
              var fe = arguments, de = fe[0];
              if (A && fe.length == 1 && ct(de))
                return A.plant(de).value();
              for (var be = 0, Pe = p ? s[be].apply(this, fe) : de; ++be < p; )
                Pe = s[be].call(this, Pe);
              return Pe;
            };
          });
        }
        function nf(i, s, p, b, C, P, A, I, re, fe) {
          var de = s & R, be = s & x, Pe = s & _, Ue = s & (k | T), Je = s & B, pt = Pe ? r : du(i);
          function Qe() {
            for (var St = arguments.length, Dt = ae(St), Hn = St; Hn--; )
              Dt[Hn] = arguments[Hn];
            if (Ue)
              var dn = ls(Qe), Wn = e5(Dt, dn);
            if (b && (Dt = y1(Dt, b, C, Ue)), P && (Dt = b1(Dt, P, A, Ue)), St -= Wn, Ue && St < fe) {
              var Tr = ro(Dt, dn);
              return M1(
                i,
                s,
                nf,
                Qe.placeholder,
                p,
                Dt,
                Tr,
                I,
                re,
                fe - St
              );
            }
            var Fi = be ? p : this, Ea = Pe ? Fi[i] : i;
            return St = Dt.length, I ? Dt = s6(Dt, I) : Je && St > 1 && Dt.reverse(), de && re < St && (Dt.length = re), this && this !== Xr && this instanceof Qe && (Ea = pt || du(Ea)), Ea.apply(Fi, Dt);
          }
          return Qe;
        }
        function C1(i, s) {
          return function(p, b) {
            return g4(p, i, s(b), {});
          };
        }
        function af(i, s) {
          return function(p, b) {
            var C;
            if (p === r && b === r)
              return s;
            if (p !== r && (C = p), b !== r) {
              if (C === r)
                return b;
              typeof p == "string" || typeof b == "string" ? (p = Un(p), b = Un(b)) : (p = c1(p), b = c1(b)), C = i(p, b);
            }
            return C;
          };
        }
        function e0(i) {
          return _a(function(s) {
            return s = gr(s, $n(Ke())), bt(function(p) {
              var b = this;
              return i(s, function(C) {
                return jn(C, b, p);
              });
            });
          });
        }
        function of(i, s) {
          s = s === r ? " " : Un(s);
          var p = s.length;
          if (p < 2)
            return p ? Vh(s, i) : s;
          var b = Vh(s, Wc(i / Ql(s)));
          return Jl(s) ? lo(Ri(b), 0, i).join("") : b.slice(0, i);
        }
        function I4(i, s, p, b) {
          var C = s & x, P = du(i);
          function A() {
            for (var I = -1, re = arguments.length, fe = -1, de = b.length, be = ae(de + re), Pe = this && this !== Xr && this instanceof A ? P : i; ++fe < de; )
              be[fe] = b[fe];
            for (; re--; )
              be[fe++] = arguments[++I];
            return jn(Pe, C ? p : this, be);
          }
          return A;
        }
        function E1(i) {
          return function(s, p, b) {
            return b && typeof b != "number" && fn(s, p, b) && (p = b = r), s = Ca(s), p === r ? (p = s, s = 0) : p = Ca(p), b = b === r ? s < p ? 1 : -1 : Ca(b), R4(s, p, b, i);
          };
        }
        function lf(i) {
          return function(s, p) {
            return typeof s == "string" && typeof p == "string" || (s = ci(s), p = ci(p)), i(s, p);
          };
        }
        function M1(i, s, p, b, C, P, A, I, re, fe) {
          var de = s & k, be = de ? A : r, Pe = de ? r : A, Ue = de ? P : r, Je = de ? r : P;
          s |= de ? E : M, s &= ~(de ? M : E), s & S || (s &= -4);
          var pt = [
            i,
            s,
            C,
            Ue,
            be,
            Je,
            Pe,
            I,
            re,
            fe
          ], Qe = p.apply(r, pt);
          return s0(i) && q1(Qe, pt), Qe.placeholder = b, j1(Qe, i, s);
        }
        function t0(i) {
          var s = Ar[i];
          return function(p, b) {
            if (p = ci(p), b = b == null ? 0 : Jr(ht(b), 292), b && jm(p)) {
              var C = (Vt(p) + "e").split("e"), P = s(C[0] + "e" + (+C[1] + b));
              return C = (Vt(P) + "e").split("e"), +(C[0] + "e" + (+C[1] - b));
            }
            return s(p);
          };
        }
        var H4 = rs && 1 / Oc(new rs([, -0]))[1] == X ? function(i) {
          return new rs(i);
        } : k0;
        function R1(i) {
          return function(s) {
            var p = Qr(s);
            return p == qe ? Fh(s) : p == We ? l5(s) : Q3(s, i(s));
          };
        }
        function wa(i, s, p, b, C, P, A, I) {
          var re = s & _;
          if (!re && typeof i != "function")
            throw new ai(l);
          var fe = b ? b.length : 0;
          if (fe || (s &= -97, b = C = r), A = A === r ? A : qr(ht(A), 0), I = I === r ? I : ht(I), fe -= C ? C.length : 0, s & M) {
            var de = b, be = C;
            b = C = r;
          }
          var Pe = re ? r : i0(i), Ue = [
            i,
            s,
            p,
            b,
            C,
            de,
            be,
            P,
            A,
            I
          ];
          if (Pe && a6(Ue, Pe), i = Ue[0], s = Ue[1], p = Ue[2], b = Ue[3], C = Ue[4], I = Ue[9] = Ue[9] === r ? re ? 0 : i.length : qr(Ue[9] - fe, 0), !I && s & (k | T) && (s &= -25), !s || s == x)
            var Je = $4(i, s, p);
          else s == k || s == T ? Je = U4(i, s, I) : (s == E || s == (x | E)) && !C.length ? Je = I4(i, s, p, b) : Je = nf.apply(r, Ue);
          var pt = Pe ? s1 : q1;
          return j1(pt(Je, Ue), i, s);
        }
        function T1(i, s, p, b) {
          return i === r || Ni(i, ts[p]) && !Qt.call(b, p) ? s : i;
        }
        function N1(i, s, p, b, C, P) {
          return xr(i) && xr(s) && (P.set(s, i), Qc(i, s, r, N1, P), P.delete(s)), i;
        }
        function W4(i) {
          return pu(i) ? r : i;
        }
        function F1(i, s, p, b, C, P) {
          var A = p & y, I = i.length, re = s.length;
          if (I != re && !(A && re > I))
            return !1;
          var fe = P.get(i), de = P.get(s);
          if (fe && de)
            return fe == s && de == i;
          var be = -1, Pe = !0, Ue = p & w ? new Ho() : r;
          for (P.set(i, s), P.set(s, i); ++be < I; ) {
            var Je = i[be], pt = s[be];
            if (b)
              var Qe = A ? b(pt, Je, be, s, i, P) : b(Je, pt, be, i, s, P);
            if (Qe !== r) {
              if (Qe)
                continue;
              Pe = !1;
              break;
            }
            if (Ue) {
              if (!Ch(s, function(St, Dt) {
                if (!tu(Ue, Dt) && (Je === St || C(Je, St, p, b, P)))
                  return Ue.push(Dt);
              })) {
                Pe = !1;
                break;
              }
            } else if (!(Je === pt || C(Je, pt, p, b, P))) {
              Pe = !1;
              break;
            }
          }
          return P.delete(i), P.delete(s), Pe;
        }
        function G4(i, s, p, b, C, P, A) {
          switch (p) {
            case Bt:
              if (i.byteLength != s.byteLength || i.byteOffset != s.byteOffset)
                return !1;
              i = i.buffer, s = s.buffer;
            case ur:
              return !(i.byteLength != s.byteLength || !P(new $c(i), new $c(s)));
            case Te:
            case Re:
            case Ve:
              return Ni(+i, +s);
            case ge:
              return i.name == s.name && i.message == s.message;
            case He:
            case Mt:
              return i == s + "";
            case qe:
              var I = Fh;
            case We:
              var re = b & y;
              if (I || (I = Oc), i.size != s.size && !re)
                return !1;
              var fe = A.get(i);
              if (fe)
                return fe == s;
              b |= w, A.set(i, s);
              var de = F1(I(i), I(s), b, C, P, A);
              return A.delete(i), de;
            case Ze:
              if (ou)
                return ou.call(i) == ou.call(s);
          }
          return !1;
        }
        function V4(i, s, p, b, C, P) {
          var A = p & y, I = r0(i), re = I.length, fe = r0(s), de = fe.length;
          if (re != de && !A)
            return !1;
          for (var be = re; be--; ) {
            var Pe = I[be];
            if (!(A ? Pe in s : Qt.call(s, Pe)))
              return !1;
          }
          var Ue = P.get(i), Je = P.get(s);
          if (Ue && Je)
            return Ue == s && Je == i;
          var pt = !0;
          P.set(i, s), P.set(s, i);
          for (var Qe = A; ++be < re; ) {
            Pe = I[be];
            var St = i[Pe], Dt = s[Pe];
            if (b)
              var Hn = A ? b(Dt, St, Pe, s, i, P) : b(St, Dt, Pe, i, s, P);
            if (!(Hn === r ? St === Dt || C(St, Dt, p, b, P) : Hn)) {
              pt = !1;
              break;
            }
            Qe || (Qe = Pe == "constructor");
          }
          if (pt && !Qe) {
            var dn = i.constructor, Wn = s.constructor;
            dn != Wn && "constructor" in i && "constructor" in s && !(typeof dn == "function" && dn instanceof dn && typeof Wn == "function" && Wn instanceof Wn) && (pt = !1);
          }
          return P.delete(i), P.delete(s), pt;
        }
        function _a(i) {
          return c0(B1(i, r, G1), i + "");
        }
        function r0(i) {
          return Km(i, Ir, o0);
        }
        function n0(i) {
          return Km(i, Sn, P1);
        }
        var i0 = Vc ? function(i) {
          return Vc.get(i);
        } : k0;
        function sf(i) {
          for (var s = i.name + "", p = ns[s], b = Qt.call(ns, s) ? p.length : 0; b--; ) {
            var C = p[b], P = C.func;
            if (P == null || P == i)
              return C.name;
          }
          return s;
        }
        function ls(i) {
          var s = Qt.call(F, "placeholder") ? F : i;
          return s.placeholder;
        }
        function Ke() {
          var i = F.iteratee || w0;
          return i = i === w0 ? e1 : i, arguments.length ? i(arguments[0], arguments[1]) : i;
        }
        function uf(i, s) {
          var p = i.__data__;
          return t6(s) ? p[typeof s == "string" ? "string" : "hash"] : p.map;
        }
        function a0(i) {
          for (var s = Ir(i), p = s.length; p--; ) {
            var b = s[p], C = i[b];
            s[p] = [b, C, O1(C)];
          }
          return s;
        }
        function Vo(i, s) {
          var p = i5(i, s);
          return Qm(p) ? p : r;
        }
        function X4(i) {
          var s = Qt.call(i, Uo), p = i[Uo];
          try {
            i[Uo] = r;
            var b = !0;
          } catch {
          }
          var C = qc.call(i);
          return b && (s ? i[Uo] = p : delete i[Uo]), C;
        }
        var o0 = zh ? function(i) {
          return i == null ? [] : (i = lr(i), eo(zh(i), function(s) {
            return Am.call(i, s);
          }));
        } : S0, P1 = zh ? function(i) {
          for (var s = []; i; )
            to(s, o0(i)), i = Uc(i);
          return s;
        } : S0, Qr = cn;
        (Dh && Qr(new Dh(new ArrayBuffer(1))) != Bt || nu && Qr(new nu()) != qe || Oh && Qr(Oh.resolve()) != ot || rs && Qr(new rs()) != We || iu && Qr(new iu()) != _t) && (Qr = function(i) {
          var s = cn(i), p = s == dt ? i.constructor : r, b = p ? Xo(p) : "";
          if (b)
            switch (b) {
              case N5:
                return Bt;
              case F5:
                return qe;
              case P5:
                return ot;
              case z5:
                return We;
              case D5:
                return _t;
            }
          return s;
        });
        function Y4(i, s, p) {
          for (var b = -1, C = p.length; ++b < C; ) {
            var P = p[b], A = P.size;
            switch (P.type) {
              case "drop":
                i += A;
                break;
              case "dropRight":
                s -= A;
                break;
              case "take":
                s = Jr(s, i + A);
                break;
              case "takeRight":
                i = qr(i, s - A);
                break;
            }
          }
          return { start: i, end: s };
        }
        function Z4(i) {
          var s = i.match(Be);
          return s ? s[1].split(ut) : [];
        }
        function z1(i, s, p) {
          s = oo(s, i);
          for (var b = -1, C = s.length, P = !1; ++b < C; ) {
            var A = Zi(s[b]);
            if (!(P = i != null && p(i, A)))
              break;
            i = i[A];
          }
          return P || ++b != C ? P : (C = i == null ? 0 : i.length, !!C && gf(C) && ka(A, C) && (ct(i) || Yo(i)));
        }
        function K4(i) {
          var s = i.length, p = new i.constructor(s);
          return s && typeof i[0] == "string" && Qt.call(i, "index") && (p.index = i.index, p.input = i.input), p;
        }
        function D1(i) {
          return typeof i.constructor == "function" && !hu(i) ? is(Uc(i)) : {};
        }
        function J4(i, s, p) {
          var b = i.constructor;
          switch (s) {
            case ur:
              return Qh(i);
            case Te:
            case Re:
              return new b(+i);
            case Bt:
              return O4(i, p);
            case At:
            case pr:
            case xn:
            case wn:
            case Ya:
            case ma:
            case Mi:
            case Za:
            case Oo:
              return g1(i, p);
            case qe:
              return new b();
            case Ve:
            case Mt:
              return new b(i);
            case He:
              return L4(i);
            case We:
              return new b();
            case Ze:
              return B4(i);
          }
        }
        function Q4(i, s) {
          var p = s.length;
          if (!p)
            return i;
          var b = p - 1;
          return s[b] = (p > 1 ? "& " : "") + s[b], s = s.join(p > 2 ? ", " : " "), i.replace(Oe, `{
/* [wrapped with ` + s + `] */
`);
        }
        function e6(i) {
          return ct(i) || Yo(i) || !!(qm && i && i[qm]);
        }
        function ka(i, s) {
          var p = typeof i;
          return s = s ?? K, !!s && (p == "number" || p != "symbol" && Tt.test(i)) && i > -1 && i % 1 == 0 && i < s;
        }
        function fn(i, s, p) {
          if (!xr(p))
            return !1;
          var b = typeof s;
          return (b == "number" ? kn(p) && ka(s, p.length) : b == "string" && s in p) ? Ni(p[s], i) : !1;
        }
        function l0(i, s) {
          if (ct(i))
            return !1;
          var p = typeof i;
          return p == "number" || p == "symbol" || p == "boolean" || i == null || In(i) ? !0 : eu.test(i) || !qo.test(i) || s != null && i in lr(s);
        }
        function t6(i) {
          var s = typeof i;
          return s == "string" || s == "number" || s == "symbol" || s == "boolean" ? i !== "__proto__" : i === null;
        }
        function s0(i) {
          var s = sf(i), p = F[s];
          if (typeof p != "function" || !(s in Nt.prototype))
            return !1;
          if (i === p)
            return !0;
          var b = i0(p);
          return !!b && i === b[0];
        }
        function r6(i) {
          return !!Om && Om in i;
        }
        var n6 = Bc ? Sa : C0;
        function hu(i) {
          var s = i && i.constructor, p = typeof s == "function" && s.prototype || ts;
          return i === p;
        }
        function O1(i) {
          return i === i && !xr(i);
        }
        function L1(i, s) {
          return function(p) {
            return p == null ? !1 : p[i] === s && (s !== r || i in lr(p));
          };
        }
        function i6(i) {
          var s = vf(i, function(b) {
            return p.size === f && p.clear(), b;
          }), p = s.cache;
          return s;
        }
        function a6(i, s) {
          var p = i[1], b = s[1], C = p | b, P = C < (x | _ | R), A = b == R && p == k || b == R && p == z && i[7].length <= s[8] || b == (R | z) && s[7].length <= s[8] && p == k;
          if (!(P || A))
            return i;
          b & x && (i[2] = s[2], C |= p & x ? 0 : S);
          var I = s[3];
          if (I) {
            var re = i[3];
            i[3] = re ? y1(re, I, s[4]) : I, i[4] = re ? ro(i[3], h) : s[4];
          }
          return I = s[5], I && (re = i[5], i[5] = re ? b1(re, I, s[6]) : I, i[6] = re ? ro(i[5], h) : s[6]), I = s[7], I && (i[7] = I), b & R && (i[8] = i[8] == null ? s[8] : Jr(i[8], s[8])), i[9] == null && (i[9] = s[9]), i[0] = s[0], i[1] = C, i;
        }
        function o6(i) {
          var s = [];
          if (i != null)
            for (var p in lr(i))
              s.push(p);
          return s;
        }
        function l6(i) {
          return qc.call(i);
        }
        function B1(i, s, p) {
          return s = qr(s === r ? i.length - 1 : s, 0), function() {
            for (var b = arguments, C = -1, P = qr(b.length - s, 0), A = ae(P); ++C < P; )
              A[C] = b[s + C];
            C = -1;
            for (var I = ae(s + 1); ++C < s; )
              I[C] = b[C];
            return I[s] = p(A), jn(i, this, I);
          };
        }
        function A1(i, s) {
          return s.length < 2 ? i : Go(i, si(s, 0, -1));
        }
        function s6(i, s) {
          for (var p = i.length, b = Jr(s.length, p), C = _n(i); b--; ) {
            var P = s[b];
            i[b] = ka(P, p) ? C[P] : r;
          }
          return i;
        }
        function u0(i, s) {
          if (!(s === "constructor" && typeof i[s] == "function") && s != "__proto__")
            return i[s];
        }
        var q1 = $1(s1), vu = k5 || function(i, s) {
          return Xr.setTimeout(i, s);
        }, c0 = $1(F4);
        function j1(i, s, p) {
          var b = s + "";
          return c0(i, Q4(b, u6(Z4(b), p)));
        }
        function $1(i) {
          var s = 0, p = 0;
          return function() {
            var b = M5(), C = j - (b - p);
            if (p = b, C > 0) {
              if (++s >= q)
                return arguments[0];
            } else
              s = 0;
            return i.apply(r, arguments);
          };
        }
        function cf(i, s) {
          var p = -1, b = i.length, C = b - 1;
          for (s = s === r ? b : s; ++p < s; ) {
            var P = Gh(p, C), A = i[P];
            i[P] = i[p], i[p] = A;
          }
          return i.length = s, i;
        }
        var U1 = i6(function(i) {
          var s = [];
          return i.charCodeAt(0) === 46 && s.push(""), i.replace(Vl, function(p, b, C, P) {
            s.push(C ? P.replace(ve, "$1") : b || p);
          }), s;
        });
        function Zi(i) {
          if (typeof i == "string" || In(i))
            return i;
          var s = i + "";
          return s == "0" && 1 / i == -X ? "-0" : s;
        }
        function Xo(i) {
          if (i != null) {
            try {
              return Ac.call(i);
            } catch {
            }
            try {
              return i + "";
            } catch {
            }
          }
          return "";
        }
        function u6(i, s) {
          return ii(ye, function(p) {
            var b = "_." + p[0];
            s & p[1] && !zc(i, b) && i.push(b);
          }), i.sort();
        }
        function I1(i) {
          if (i instanceof Nt)
            return i.clone();
          var s = new oi(i.__wrapped__, i.__chain__);
          return s.__actions__ = _n(i.__actions__), s.__index__ = i.__index__, s.__values__ = i.__values__, s;
        }
        function c6(i, s, p) {
          (p ? fn(i, s, p) : s === r) ? s = 1 : s = qr(ht(s), 0);
          var b = i == null ? 0 : i.length;
          if (!b || s < 1)
            return [];
          for (var C = 0, P = 0, A = ae(Wc(b / s)); C < b; )
            A[P++] = si(i, C, C += s);
          return A;
        }
        function f6(i) {
          for (var s = -1, p = i == null ? 0 : i.length, b = 0, C = []; ++s < p; ) {
            var P = i[s];
            P && (C[b++] = P);
          }
          return C;
        }
        function d6() {
          var i = arguments.length;
          if (!i)
            return [];
          for (var s = ae(i - 1), p = arguments[0], b = i; b--; )
            s[b - 1] = arguments[b];
          return to(ct(p) ? _n(p) : [p], Yr(s, 1));
        }
        var h6 = bt(function(i, s) {
          return Rr(i) ? su(i, Yr(s, 1, Rr, !0)) : [];
        }), v6 = bt(function(i, s) {
          var p = ui(s);
          return Rr(p) && (p = r), Rr(i) ? su(i, Yr(s, 1, Rr, !0), Ke(p, 2)) : [];
        }), p6 = bt(function(i, s) {
          var p = ui(s);
          return Rr(p) && (p = r), Rr(i) ? su(i, Yr(s, 1, Rr, !0), r, p) : [];
        });
        function g6(i, s, p) {
          var b = i == null ? 0 : i.length;
          return b ? (s = p || s === r ? 1 : ht(s), si(i, s < 0 ? 0 : s, b)) : [];
        }
        function m6(i, s, p) {
          var b = i == null ? 0 : i.length;
          return b ? (s = p || s === r ? 1 : ht(s), s = b - s, si(i, 0, s < 0 ? 0 : s)) : [];
        }
        function y6(i, s) {
          return i && i.length ? tf(i, Ke(s, 3), !0, !0) : [];
        }
        function b6(i, s) {
          return i && i.length ? tf(i, Ke(s, 3), !0) : [];
        }
        function x6(i, s, p, b) {
          var C = i == null ? 0 : i.length;
          return C ? (p && typeof p != "number" && fn(i, s, p) && (p = 0, b = C), d4(i, s, p, b)) : [];
        }
        function H1(i, s, p) {
          var b = i == null ? 0 : i.length;
          if (!b)
            return -1;
          var C = p == null ? 0 : ht(p);
          return C < 0 && (C = qr(b + C, 0)), Dc(i, Ke(s, 3), C);
        }
        function W1(i, s, p) {
          var b = i == null ? 0 : i.length;
          if (!b)
            return -1;
          var C = b - 1;
          return p !== r && (C = ht(p), C = p < 0 ? qr(b + C, 0) : Jr(C, b - 1)), Dc(i, Ke(s, 3), C, !0);
        }
        function G1(i) {
          var s = i == null ? 0 : i.length;
          return s ? Yr(i, 1) : [];
        }
        function w6(i) {
          var s = i == null ? 0 : i.length;
          return s ? Yr(i, X) : [];
        }
        function _6(i, s) {
          var p = i == null ? 0 : i.length;
          return p ? (s = s === r ? 1 : ht(s), Yr(i, s)) : [];
        }
        function k6(i) {
          for (var s = -1, p = i == null ? 0 : i.length, b = {}; ++s < p; ) {
            var C = i[s];
            b[C[0]] = C[1];
          }
          return b;
        }
        function V1(i) {
          return i && i.length ? i[0] : r;
        }
        function S6(i, s, p) {
          var b = i == null ? 0 : i.length;
          if (!b)
            return -1;
          var C = p == null ? 0 : ht(p);
          return C < 0 && (C = qr(b + C, 0)), Kl(i, s, C);
        }
        function C6(i) {
          var s = i == null ? 0 : i.length;
          return s ? si(i, 0, -1) : [];
        }
        var E6 = bt(function(i) {
          var s = gr(i, Kh);
          return s.length && s[0] === i[0] ? $h(s) : [];
        }), M6 = bt(function(i) {
          var s = ui(i), p = gr(i, Kh);
          return s === ui(p) ? s = r : p.pop(), p.length && p[0] === i[0] ? $h(p, Ke(s, 2)) : [];
        }), R6 = bt(function(i) {
          var s = ui(i), p = gr(i, Kh);
          return s = typeof s == "function" ? s : r, s && p.pop(), p.length && p[0] === i[0] ? $h(p, r, s) : [];
        });
        function T6(i, s) {
          return i == null ? "" : C5.call(i, s);
        }
        function ui(i) {
          var s = i == null ? 0 : i.length;
          return s ? i[s - 1] : r;
        }
        function N6(i, s, p) {
          var b = i == null ? 0 : i.length;
          if (!b)
            return -1;
          var C = b;
          return p !== r && (C = ht(p), C = C < 0 ? qr(b + C, 0) : Jr(C, b - 1)), s === s ? u5(i, s, C) : Dc(i, Mm, C, !0);
        }
        function F6(i, s) {
          return i && i.length ? i1(i, ht(s)) : r;
        }
        var P6 = bt(X1);
        function X1(i, s) {
          return i && i.length && s && s.length ? Wh(i, s) : i;
        }
        function z6(i, s, p) {
          return i && i.length && s && s.length ? Wh(i, s, Ke(p, 2)) : i;
        }
        function D6(i, s, p) {
          return i && i.length && s && s.length ? Wh(i, s, r, p) : i;
        }
        var O6 = _a(function(i, s) {
          var p = i == null ? 0 : i.length, b = Bh(i, s);
          return l1(i, gr(s, function(C) {
            return ka(C, p) ? +C : C;
          }).sort(m1)), b;
        });
        function L6(i, s) {
          var p = [];
          if (!(i && i.length))
            return p;
          var b = -1, C = [], P = i.length;
          for (s = Ke(s, 3); ++b < P; ) {
            var A = i[b];
            s(A, b, i) && (p.push(A), C.push(b));
          }
          return l1(i, C), p;
        }
        function f0(i) {
          return i == null ? i : T5.call(i);
        }
        function B6(i, s, p) {
          var b = i == null ? 0 : i.length;
          return b ? (p && typeof p != "number" && fn(i, s, p) ? (s = 0, p = b) : (s = s == null ? 0 : ht(s), p = p === r ? b : ht(p)), si(i, s, p)) : [];
        }
        function A6(i, s) {
          return ef(i, s);
        }
        function q6(i, s, p) {
          return Xh(i, s, Ke(p, 2));
        }
        function j6(i, s) {
          var p = i == null ? 0 : i.length;
          if (p) {
            var b = ef(i, s);
            if (b < p && Ni(i[b], s))
              return b;
          }
          return -1;
        }
        function $6(i, s) {
          return ef(i, s, !0);
        }
        function U6(i, s, p) {
          return Xh(i, s, Ke(p, 2), !0);
        }
        function I6(i, s) {
          var p = i == null ? 0 : i.length;
          if (p) {
            var b = ef(i, s, !0) - 1;
            if (Ni(i[b], s))
              return b;
          }
          return -1;
        }
        function H6(i) {
          return i && i.length ? u1(i) : [];
        }
        function W6(i, s) {
          return i && i.length ? u1(i, Ke(s, 2)) : [];
        }
        function G6(i) {
          var s = i == null ? 0 : i.length;
          return s ? si(i, 1, s) : [];
        }
        function V6(i, s, p) {
          return i && i.length ? (s = p || s === r ? 1 : ht(s), si(i, 0, s < 0 ? 0 : s)) : [];
        }
        function X6(i, s, p) {
          var b = i == null ? 0 : i.length;
          return b ? (s = p || s === r ? 1 : ht(s), s = b - s, si(i, s < 0 ? 0 : s, b)) : [];
        }
        function Y6(i, s) {
          return i && i.length ? tf(i, Ke(s, 3), !1, !0) : [];
        }
        function Z6(i, s) {
          return i && i.length ? tf(i, Ke(s, 3)) : [];
        }
        var K6 = bt(function(i) {
          return ao(Yr(i, 1, Rr, !0));
        }), J6 = bt(function(i) {
          var s = ui(i);
          return Rr(s) && (s = r), ao(Yr(i, 1, Rr, !0), Ke(s, 2));
        }), Q6 = bt(function(i) {
          var s = ui(i);
          return s = typeof s == "function" ? s : r, ao(Yr(i, 1, Rr, !0), r, s);
        });
        function e8(i) {
          return i && i.length ? ao(i) : [];
        }
        function t8(i, s) {
          return i && i.length ? ao(i, Ke(s, 2)) : [];
        }
        function r8(i, s) {
          return s = typeof s == "function" ? s : r, i && i.length ? ao(i, r, s) : [];
        }
        function d0(i) {
          if (!(i && i.length))
            return [];
          var s = 0;
          return i = eo(i, function(p) {
            if (Rr(p))
              return s = qr(p.length, s), !0;
          }), Th(s, function(p) {
            return gr(i, Eh(p));
          });
        }
        function Y1(i, s) {
          if (!(i && i.length))
            return [];
          var p = d0(i);
          return s == null ? p : gr(p, function(b) {
            return jn(s, r, b);
          });
        }
        var n8 = bt(function(i, s) {
          return Rr(i) ? su(i, s) : [];
        }), i8 = bt(function(i) {
          return Zh(eo(i, Rr));
        }), a8 = bt(function(i) {
          var s = ui(i);
          return Rr(s) && (s = r), Zh(eo(i, Rr), Ke(s, 2));
        }), o8 = bt(function(i) {
          var s = ui(i);
          return s = typeof s == "function" ? s : r, Zh(eo(i, Rr), r, s);
        }), l8 = bt(d0);
        function s8(i, s) {
          return h1(i || [], s || [], lu);
        }
        function u8(i, s) {
          return h1(i || [], s || [], fu);
        }
        var c8 = bt(function(i) {
          var s = i.length, p = s > 1 ? i[s - 1] : r;
          return p = typeof p == "function" ? (i.pop(), p) : r, Y1(i, p);
        });
        function Z1(i) {
          var s = F(i);
          return s.__chain__ = !0, s;
        }
        function f8(i, s) {
          return s(i), i;
        }
        function ff(i, s) {
          return s(i);
        }
        var d8 = _a(function(i) {
          var s = i.length, p = s ? i[0] : 0, b = this.__wrapped__, C = function(P) {
            return Bh(P, i);
          };
          return s > 1 || this.__actions__.length || !(b instanceof Nt) || !ka(p) ? this.thru(C) : (b = b.slice(p, +p + (s ? 1 : 0)), b.__actions__.push({
            func: ff,
            args: [C],
            thisArg: r
          }), new oi(b, this.__chain__).thru(function(P) {
            return s && !P.length && P.push(r), P;
          }));
        });
        function h8() {
          return Z1(this);
        }
        function v8() {
          return new oi(this.value(), this.__chain__);
        }
        function p8() {
          this.__values__ === r && (this.__values__ = cy(this.value()));
          var i = this.__index__ >= this.__values__.length, s = i ? r : this.__values__[this.__index__++];
          return { done: i, value: s };
        }
        function g8() {
          return this;
        }
        function m8(i) {
          for (var s, p = this; p instanceof Yc; ) {
            var b = I1(p);
            b.__index__ = 0, b.__values__ = r, s ? C.__wrapped__ = b : s = b;
            var C = b;
            p = p.__wrapped__;
          }
          return C.__wrapped__ = i, s;
        }
        function y8() {
          var i = this.__wrapped__;
          if (i instanceof Nt) {
            var s = i;
            return this.__actions__.length && (s = new Nt(this)), s = s.reverse(), s.__actions__.push({
              func: ff,
              args: [f0],
              thisArg: r
            }), new oi(s, this.__chain__);
          }
          return this.thru(f0);
        }
        function b8() {
          return d1(this.__wrapped__, this.__actions__);
        }
        var x8 = rf(function(i, s, p) {
          Qt.call(i, p) ? ++i[p] : xa(i, p, 1);
        });
        function w8(i, s, p) {
          var b = ct(i) ? Cm : f4;
          return p && fn(i, s, p) && (s = r), b(i, Ke(s, 3));
        }
        function _8(i, s) {
          var p = ct(i) ? eo : Ym;
          return p(i, Ke(s, 3));
        }
        var k8 = k1(H1), S8 = k1(W1);
        function C8(i, s) {
          return Yr(df(i, s), 1);
        }
        function E8(i, s) {
          return Yr(df(i, s), X);
        }
        function M8(i, s, p) {
          return p = p === r ? 1 : ht(p), Yr(df(i, s), p);
        }
        function K1(i, s) {
          var p = ct(i) ? ii : io;
          return p(i, Ke(s, 3));
        }
        function J1(i, s) {
          var p = ct(i) ? G3 : Xm;
          return p(i, Ke(s, 3));
        }
        var R8 = rf(function(i, s, p) {
          Qt.call(i, p) ? i[p].push(s) : xa(i, p, [s]);
        });
        function T8(i, s, p, b) {
          i = kn(i) ? i : us(i), p = p && !b ? ht(p) : 0;
          var C = i.length;
          return p < 0 && (p = qr(C + p, 0)), mf(i) ? p <= C && i.indexOf(s, p) > -1 : !!C && Kl(i, s, p) > -1;
        }
        var N8 = bt(function(i, s, p) {
          var b = -1, C = typeof s == "function", P = kn(i) ? ae(i.length) : [];
          return io(i, function(A) {
            P[++b] = C ? jn(s, A, p) : uu(A, s, p);
          }), P;
        }), F8 = rf(function(i, s, p) {
          xa(i, p, s);
        });
        function df(i, s) {
          var p = ct(i) ? gr : t1;
          return p(i, Ke(s, 3));
        }
        function P8(i, s, p, b) {
          return i == null ? [] : (ct(s) || (s = s == null ? [] : [s]), p = b ? r : p, ct(p) || (p = p == null ? [] : [p]), a1(i, s, p));
        }
        var z8 = rf(function(i, s, p) {
          i[p ? 0 : 1].push(s);
        }, function() {
          return [[], []];
        });
        function D8(i, s, p) {
          var b = ct(i) ? Sh : Tm, C = arguments.length < 3;
          return b(i, Ke(s, 4), p, C, io);
        }
        function O8(i, s, p) {
          var b = ct(i) ? V3 : Tm, C = arguments.length < 3;
          return b(i, Ke(s, 4), p, C, Xm);
        }
        function L8(i, s) {
          var p = ct(i) ? eo : Ym;
          return p(i, pf(Ke(s, 3)));
        }
        function B8(i) {
          var s = ct(i) ? Hm : T4;
          return s(i);
        }
        function A8(i, s, p) {
          (p ? fn(i, s, p) : s === r) ? s = 1 : s = ht(s);
          var b = ct(i) ? o4 : N4;
          return b(i, s);
        }
        function q8(i) {
          var s = ct(i) ? l4 : P4;
          return s(i);
        }
        function j8(i) {
          if (i == null)
            return 0;
          if (kn(i))
            return mf(i) ? Ql(i) : i.length;
          var s = Qr(i);
          return s == qe || s == We ? i.size : Ih(i).length;
        }
        function $8(i, s, p) {
          var b = ct(i) ? Ch : z4;
          return p && fn(i, s, p) && (s = r), b(i, Ke(s, 3));
        }
        var U8 = bt(function(i, s) {
          if (i == null)
            return [];
          var p = s.length;
          return p > 1 && fn(i, s[0], s[1]) ? s = [] : p > 2 && fn(s[0], s[1], s[2]) && (s = [s[0]]), a1(i, Yr(s, 1), []);
        }), hf = _5 || function() {
          return Xr.Date.now();
        };
        function I8(i, s) {
          if (typeof s != "function")
            throw new ai(l);
          return i = ht(i), function() {
            if (--i < 1)
              return s.apply(this, arguments);
          };
        }
        function Q1(i, s, p) {
          return s = p ? r : s, s = i && s == null ? i.length : s, wa(i, R, r, r, r, r, s);
        }
        function ey(i, s) {
          var p;
          if (typeof s != "function")
            throw new ai(l);
          return i = ht(i), function() {
            return --i > 0 && (p = s.apply(this, arguments)), i <= 1 && (s = r), p;
          };
        }
        var h0 = bt(function(i, s, p) {
          var b = x;
          if (p.length) {
            var C = ro(p, ls(h0));
            b |= E;
          }
          return wa(i, b, s, p, C);
        }), ty = bt(function(i, s, p) {
          var b = x | _;
          if (p.length) {
            var C = ro(p, ls(ty));
            b |= E;
          }
          return wa(s, b, i, p, C);
        });
        function ry(i, s, p) {
          s = p ? r : s;
          var b = wa(i, k, r, r, r, r, r, s);
          return b.placeholder = ry.placeholder, b;
        }
        function ny(i, s, p) {
          s = p ? r : s;
          var b = wa(i, T, r, r, r, r, r, s);
          return b.placeholder = ny.placeholder, b;
        }
        function iy(i, s, p) {
          var b, C, P, A, I, re, fe = 0, de = !1, be = !1, Pe = !0;
          if (typeof i != "function")
            throw new ai(l);
          s = ci(s) || 0, xr(p) && (de = !!p.leading, be = "maxWait" in p, P = be ? qr(ci(p.maxWait) || 0, s) : P, Pe = "trailing" in p ? !!p.trailing : Pe);
          function Ue(Tr) {
            var Fi = b, Ea = C;
            return b = C = r, fe = Tr, A = i.apply(Ea, Fi), A;
          }
          function Je(Tr) {
            return fe = Tr, I = vu(St, s), de ? Ue(Tr) : A;
          }
          function pt(Tr) {
            var Fi = Tr - re, Ea = Tr - fe, ky = s - Fi;
            return be ? Jr(ky, P - Ea) : ky;
          }
          function Qe(Tr) {
            var Fi = Tr - re, Ea = Tr - fe;
            return re === r || Fi >= s || Fi < 0 || be && Ea >= P;
          }
          function St() {
            var Tr = hf();
            if (Qe(Tr))
              return Dt(Tr);
            I = vu(St, pt(Tr));
          }
          function Dt(Tr) {
            return I = r, Pe && b ? Ue(Tr) : (b = C = r, A);
          }
          function Hn() {
            I !== r && v1(I), fe = 0, b = re = C = I = r;
          }
          function dn() {
            return I === r ? A : Dt(hf());
          }
          function Wn() {
            var Tr = hf(), Fi = Qe(Tr);
            if (b = arguments, C = this, re = Tr, Fi) {
              if (I === r)
                return Je(re);
              if (be)
                return v1(I), I = vu(St, s), Ue(re);
            }
            return I === r && (I = vu(St, s)), A;
          }
          return Wn.cancel = Hn, Wn.flush = dn, Wn;
        }
        var H8 = bt(function(i, s) {
          return Vm(i, 1, s);
        }), W8 = bt(function(i, s, p) {
          return Vm(i, ci(s) || 0, p);
        });
        function G8(i) {
          return wa(i, B);
        }
        function vf(i, s) {
          if (typeof i != "function" || s != null && typeof s != "function")
            throw new ai(l);
          var p = function() {
            var b = arguments, C = s ? s.apply(this, b) : b[0], P = p.cache;
            if (P.has(C))
              return P.get(C);
            var A = i.apply(this, b);
            return p.cache = P.set(C, A) || P, A;
          };
          return p.cache = new (vf.Cache || ba)(), p;
        }
        vf.Cache = ba;
        function pf(i) {
          if (typeof i != "function")
            throw new ai(l);
          return function() {
            var s = arguments;
            switch (s.length) {
              case 0:
                return !i.call(this);
              case 1:
                return !i.call(this, s[0]);
              case 2:
                return !i.call(this, s[0], s[1]);
              case 3:
                return !i.call(this, s[0], s[1], s[2]);
            }
            return !i.apply(this, s);
          };
        }
        function V8(i) {
          return ey(2, i);
        }
        var X8 = D4(function(i, s) {
          s = s.length == 1 && ct(s[0]) ? gr(s[0], $n(Ke())) : gr(Yr(s, 1), $n(Ke()));
          var p = s.length;
          return bt(function(b) {
            for (var C = -1, P = Jr(b.length, p); ++C < P; )
              b[C] = s[C].call(this, b[C]);
            return jn(i, this, b);
          });
        }), v0 = bt(function(i, s) {
          var p = ro(s, ls(v0));
          return wa(i, E, r, s, p);
        }), ay = bt(function(i, s) {
          var p = ro(s, ls(ay));
          return wa(i, M, r, s, p);
        }), Y8 = _a(function(i, s) {
          return wa(i, z, r, r, r, s);
        });
        function Z8(i, s) {
          if (typeof i != "function")
            throw new ai(l);
          return s = s === r ? s : ht(s), bt(i, s);
        }
        function K8(i, s) {
          if (typeof i != "function")
            throw new ai(l);
          return s = s == null ? 0 : qr(ht(s), 0), bt(function(p) {
            var b = p[s], C = lo(p, 0, s);
            return b && to(C, b), jn(i, this, C);
          });
        }
        function J8(i, s, p) {
          var b = !0, C = !0;
          if (typeof i != "function")
            throw new ai(l);
          return xr(p) && (b = "leading" in p ? !!p.leading : b, C = "trailing" in p ? !!p.trailing : C), iy(i, s, {
            leading: b,
            maxWait: s,
            trailing: C
          });
        }
        function Q8(i) {
          return Q1(i, 1);
        }
        function e7(i, s) {
          return v0(Jh(s), i);
        }
        function t7() {
          if (!arguments.length)
            return [];
          var i = arguments[0];
          return ct(i) ? i : [i];
        }
        function r7(i) {
          return li(i, m);
        }
        function n7(i, s) {
          return s = typeof s == "function" ? s : r, li(i, m, s);
        }
        function i7(i) {
          return li(i, d | m);
        }
        function a7(i, s) {
          return s = typeof s == "function" ? s : r, li(i, d | m, s);
        }
        function o7(i, s) {
          return s == null || Gm(i, s, Ir(s));
        }
        function Ni(i, s) {
          return i === s || i !== i && s !== s;
        }
        var l7 = lf(jh), s7 = lf(function(i, s) {
          return i >= s;
        }), Yo = Jm(/* @__PURE__ */ function() {
          return arguments;
        }()) ? Jm : function(i) {
          return _r(i) && Qt.call(i, "callee") && !Am.call(i, "callee");
        }, ct = ae.isArray, u7 = bm ? $n(bm) : m4;
        function kn(i) {
          return i != null && gf(i.length) && !Sa(i);
        }
        function Rr(i) {
          return _r(i) && kn(i);
        }
        function c7(i) {
          return i === !0 || i === !1 || _r(i) && cn(i) == Te;
        }
        var so = S5 || C0, f7 = xm ? $n(xm) : y4;
        function d7(i) {
          return _r(i) && i.nodeType === 1 && !pu(i);
        }
        function h7(i) {
          if (i == null)
            return !0;
          if (kn(i) && (ct(i) || typeof i == "string" || typeof i.splice == "function" || so(i) || ss(i) || Yo(i)))
            return !i.length;
          var s = Qr(i);
          if (s == qe || s == We)
            return !i.size;
          if (hu(i))
            return !Ih(i).length;
          for (var p in i)
            if (Qt.call(i, p))
              return !1;
          return !0;
        }
        function v7(i, s) {
          return cu(i, s);
        }
        function p7(i, s, p) {
          p = typeof p == "function" ? p : r;
          var b = p ? p(i, s) : r;
          return b === r ? cu(i, s, r, p) : !!b;
        }
        function p0(i) {
          if (!_r(i))
            return !1;
          var s = cn(i);
          return s == ge || s == ke || typeof i.message == "string" && typeof i.name == "string" && !pu(i);
        }
        function g7(i) {
          return typeof i == "number" && jm(i);
        }
        function Sa(i) {
          if (!xr(i))
            return !1;
          var s = cn(i);
          return s == we || s == $e || s == Ee || s == wt;
        }
        function oy(i) {
          return typeof i == "number" && i == ht(i);
        }
        function gf(i) {
          return typeof i == "number" && i > -1 && i % 1 == 0 && i <= K;
        }
        function xr(i) {
          var s = typeof i;
          return i != null && (s == "object" || s == "function");
        }
        function _r(i) {
          return i != null && typeof i == "object";
        }
        var ly = wm ? $n(wm) : x4;
        function m7(i, s) {
          return i === s || Uh(i, s, a0(s));
        }
        function y7(i, s, p) {
          return p = typeof p == "function" ? p : r, Uh(i, s, a0(s), p);
        }
        function b7(i) {
          return sy(i) && i != +i;
        }
        function x7(i) {
          if (n6(i))
            throw new lt(o);
          return Qm(i);
        }
        function w7(i) {
          return i === null;
        }
        function _7(i) {
          return i == null;
        }
        function sy(i) {
          return typeof i == "number" || _r(i) && cn(i) == Ve;
        }
        function pu(i) {
          if (!_r(i) || cn(i) != dt)
            return !1;
          var s = Uc(i);
          if (s === null)
            return !0;
          var p = Qt.call(s, "constructor") && s.constructor;
          return typeof p == "function" && p instanceof p && Ac.call(p) == y5;
        }
        var g0 = _m ? $n(_m) : w4;
        function k7(i) {
          return oy(i) && i >= -K && i <= K;
        }
        var uy = km ? $n(km) : _4;
        function mf(i) {
          return typeof i == "string" || !ct(i) && _r(i) && cn(i) == Mt;
        }
        function In(i) {
          return typeof i == "symbol" || _r(i) && cn(i) == Ze;
        }
        var ss = Sm ? $n(Sm) : k4;
        function S7(i) {
          return i === r;
        }
        function C7(i) {
          return _r(i) && Qr(i) == _t;
        }
        function E7(i) {
          return _r(i) && cn(i) == br;
        }
        var M7 = lf(Hh), R7 = lf(function(i, s) {
          return i <= s;
        });
        function cy(i) {
          if (!i)
            return [];
          if (kn(i))
            return mf(i) ? Ri(i) : _n(i);
          if (ru && i[ru])
            return o5(i[ru]());
          var s = Qr(i), p = s == qe ? Fh : s == We ? Oc : us;
          return p(i);
        }
        function Ca(i) {
          if (!i)
            return i === 0 ? i : 0;
          if (i = ci(i), i === X || i === -X) {
            var s = i < 0 ? -1 : 1;
            return s * V;
          }
          return i === i ? i : 0;
        }
        function ht(i) {
          var s = Ca(i), p = s % 1;
          return s === s ? p ? s - p : s : 0;
        }
        function fy(i) {
          return i ? Wo(ht(i), 0, Z) : 0;
        }
        function ci(i) {
          if (typeof i == "number")
            return i;
          if (In(i))
            return U;
          if (xr(i)) {
            var s = typeof i.valueOf == "function" ? i.valueOf() : i;
            i = xr(s) ? s + "" : s;
          }
          if (typeof i != "string")
            return i === 0 ? i : +i;
          i = Nm(i);
          var p = Rt.test(i);
          return p || Xe.test(i) ? I3(i.slice(2), p ? 2 : 8) : vt.test(i) ? U : +i;
        }
        function dy(i) {
          return Yi(i, Sn(i));
        }
        function T7(i) {
          return i ? Wo(ht(i), -K, K) : i === 0 ? i : 0;
        }
        function Vt(i) {
          return i == null ? "" : Un(i);
        }
        var N7 = as(function(i, s) {
          if (hu(s) || kn(s)) {
            Yi(s, Ir(s), i);
            return;
          }
          for (var p in s)
            Qt.call(s, p) && lu(i, p, s[p]);
        }), hy = as(function(i, s) {
          Yi(s, Sn(s), i);
        }), yf = as(function(i, s, p, b) {
          Yi(s, Sn(s), i, b);
        }), F7 = as(function(i, s, p, b) {
          Yi(s, Ir(s), i, b);
        }), P7 = _a(Bh);
        function z7(i, s) {
          var p = is(i);
          return s == null ? p : Wm(p, s);
        }
        var D7 = bt(function(i, s) {
          i = lr(i);
          var p = -1, b = s.length, C = b > 2 ? s[2] : r;
          for (C && fn(s[0], s[1], C) && (b = 1); ++p < b; )
            for (var P = s[p], A = Sn(P), I = -1, re = A.length; ++I < re; ) {
              var fe = A[I], de = i[fe];
              (de === r || Ni(de, ts[fe]) && !Qt.call(i, fe)) && (i[fe] = P[fe]);
            }
          return i;
        }), O7 = bt(function(i) {
          return i.push(r, N1), jn(vy, r, i);
        });
        function L7(i, s) {
          return Em(i, Ke(s, 3), Xi);
        }
        function B7(i, s) {
          return Em(i, Ke(s, 3), qh);
        }
        function A7(i, s) {
          return i == null ? i : Ah(i, Ke(s, 3), Sn);
        }
        function q7(i, s) {
          return i == null ? i : Zm(i, Ke(s, 3), Sn);
        }
        function j7(i, s) {
          return i && Xi(i, Ke(s, 3));
        }
        function $7(i, s) {
          return i && qh(i, Ke(s, 3));
        }
        function U7(i) {
          return i == null ? [] : Jc(i, Ir(i));
        }
        function I7(i) {
          return i == null ? [] : Jc(i, Sn(i));
        }
        function m0(i, s, p) {
          var b = i == null ? r : Go(i, s);
          return b === r ? p : b;
        }
        function H7(i, s) {
          return i != null && z1(i, s, h4);
        }
        function y0(i, s) {
          return i != null && z1(i, s, v4);
        }
        var W7 = C1(function(i, s, p) {
          s != null && typeof s.toString != "function" && (s = qc.call(s)), i[s] = p;
        }, x0(Cn)), G7 = C1(function(i, s, p) {
          s != null && typeof s.toString != "function" && (s = qc.call(s)), Qt.call(i, s) ? i[s].push(p) : i[s] = [p];
        }, Ke), V7 = bt(uu);
        function Ir(i) {
          return kn(i) ? Im(i) : Ih(i);
        }
        function Sn(i) {
          return kn(i) ? Im(i, !0) : S4(i);
        }
        function X7(i, s) {
          var p = {};
          return s = Ke(s, 3), Xi(i, function(b, C, P) {
            xa(p, s(b, C, P), b);
          }), p;
        }
        function Y7(i, s) {
          var p = {};
          return s = Ke(s, 3), Xi(i, function(b, C, P) {
            xa(p, C, s(b, C, P));
          }), p;
        }
        var Z7 = as(function(i, s, p) {
          Qc(i, s, p);
        }), vy = as(function(i, s, p, b) {
          Qc(i, s, p, b);
        }), K7 = _a(function(i, s) {
          var p = {};
          if (i == null)
            return p;
          var b = !1;
          s = gr(s, function(P) {
            return P = oo(P, i), b || (b = P.length > 1), P;
          }), Yi(i, n0(i), p), b && (p = li(p, d | g | m, W4));
          for (var C = s.length; C--; )
            Yh(p, s[C]);
          return p;
        });
        function J7(i, s) {
          return py(i, pf(Ke(s)));
        }
        var Q7 = _a(function(i, s) {
          return i == null ? {} : E4(i, s);
        });
        function py(i, s) {
          if (i == null)
            return {};
          var p = gr(n0(i), function(b) {
            return [b];
          });
          return s = Ke(s), o1(i, p, function(b, C) {
            return s(b, C[0]);
          });
        }
        function eS(i, s, p) {
          s = oo(s, i);
          var b = -1, C = s.length;
          for (C || (C = 1, i = r); ++b < C; ) {
            var P = i == null ? r : i[Zi(s[b])];
            P === r && (b = C, P = p), i = Sa(P) ? P.call(i) : P;
          }
          return i;
        }
        function tS(i, s, p) {
          return i == null ? i : fu(i, s, p);
        }
        function rS(i, s, p, b) {
          return b = typeof b == "function" ? b : r, i == null ? i : fu(i, s, p, b);
        }
        var gy = R1(Ir), my = R1(Sn);
        function nS(i, s, p) {
          var b = ct(i), C = b || so(i) || ss(i);
          if (s = Ke(s, 4), p == null) {
            var P = i && i.constructor;
            C ? p = b ? new P() : [] : xr(i) ? p = Sa(P) ? is(Uc(i)) : {} : p = {};
          }
          return (C ? ii : Xi)(i, function(A, I, re) {
            return s(p, A, I, re);
          }), p;
        }
        function iS(i, s) {
          return i == null ? !0 : Yh(i, s);
        }
        function aS(i, s, p) {
          return i == null ? i : f1(i, s, Jh(p));
        }
        function oS(i, s, p, b) {
          return b = typeof b == "function" ? b : r, i == null ? i : f1(i, s, Jh(p), b);
        }
        function us(i) {
          return i == null ? [] : Nh(i, Ir(i));
        }
        function lS(i) {
          return i == null ? [] : Nh(i, Sn(i));
        }
        function sS(i, s, p) {
          return p === r && (p = s, s = r), p !== r && (p = ci(p), p = p === p ? p : 0), s !== r && (s = ci(s), s = s === s ? s : 0), Wo(ci(i), s, p);
        }
        function uS(i, s, p) {
          return s = Ca(s), p === r ? (p = s, s = 0) : p = Ca(p), i = ci(i), p4(i, s, p);
        }
        function cS(i, s, p) {
          if (p && typeof p != "boolean" && fn(i, s, p) && (s = p = r), p === r && (typeof s == "boolean" ? (p = s, s = r) : typeof i == "boolean" && (p = i, i = r)), i === r && s === r ? (i = 0, s = 1) : (i = Ca(i), s === r ? (s = i, i = 0) : s = Ca(s)), i > s) {
            var b = i;
            i = s, s = b;
          }
          if (p || i % 1 || s % 1) {
            var C = $m();
            return Jr(i + C * (s - i + U3("1e-" + ((C + "").length - 1))), s);
          }
          return Gh(i, s);
        }
        var fS = os(function(i, s, p) {
          return s = s.toLowerCase(), i + (p ? yy(s) : s);
        });
        function yy(i) {
          return b0(Vt(i).toLowerCase());
        }
        function by(i) {
          return i = Vt(i), i && i.replace(cr, t5).replace(P3, "");
        }
        function dS(i, s, p) {
          i = Vt(i), s = Un(s);
          var b = i.length;
          p = p === r ? b : Wo(ht(p), 0, b);
          var C = p;
          return p -= s.length, p >= 0 && i.slice(p, C) == s;
        }
        function hS(i) {
          return i = Vt(i), i && Bo.test(i) ? i.replace(Qa, r5) : i;
        }
        function vS(i) {
          return i = Vt(i), i && he.test(i) ? i.replace(jo, "\\$&") : i;
        }
        var pS = os(function(i, s, p) {
          return i + (p ? "-" : "") + s.toLowerCase();
        }), gS = os(function(i, s, p) {
          return i + (p ? " " : "") + s.toLowerCase();
        }), mS = _1("toLowerCase");
        function yS(i, s, p) {
          i = Vt(i), s = ht(s);
          var b = s ? Ql(i) : 0;
          if (!s || b >= s)
            return i;
          var C = (s - b) / 2;
          return of(Gc(C), p) + i + of(Wc(C), p);
        }
        function bS(i, s, p) {
          i = Vt(i), s = ht(s);
          var b = s ? Ql(i) : 0;
          return s && b < s ? i + of(s - b, p) : i;
        }
        function xS(i, s, p) {
          i = Vt(i), s = ht(s);
          var b = s ? Ql(i) : 0;
          return s && b < s ? of(s - b, p) + i : i;
        }
        function wS(i, s, p) {
          return p || s == null ? s = 0 : s && (s = +s), R5(Vt(i).replace(ze, ""), s || 0);
        }
        function _S(i, s, p) {
          return (p ? fn(i, s, p) : s === r) ? s = 1 : s = ht(s), Vh(Vt(i), s);
        }
        function kS() {
          var i = arguments, s = Vt(i[0]);
          return i.length < 3 ? s : s.replace(i[1], i[2]);
        }
        var SS = os(function(i, s, p) {
          return i + (p ? "_" : "") + s.toLowerCase();
        });
        function CS(i, s, p) {
          return p && typeof p != "number" && fn(i, s, p) && (s = p = r), p = p === r ? Z : p >>> 0, p ? (i = Vt(i), i && (typeof s == "string" || s != null && !g0(s)) && (s = Un(s), !s && Jl(i)) ? lo(Ri(i), 0, p) : i.split(s, p)) : [];
        }
        var ES = os(function(i, s, p) {
          return i + (p ? " " : "") + b0(s);
        });
        function MS(i, s, p) {
          return i = Vt(i), p = p == null ? 0 : Wo(ht(p), 0, i.length), s = Un(s), i.slice(p, p + s.length) == s;
        }
        function RS(i, s, p) {
          var b = F.templateSettings;
          p && fn(i, s, p) && (s = r), i = Vt(i), s = yf({}, s, b, T1);
          var C = yf({}, s.imports, b.imports, T1), P = Ir(C), A = Nh(C, P), I, re, fe = 0, de = s.interpolate || zr, be = "__p += '", Pe = Ph(
            (s.escape || zr).source + "|" + de.source + "|" + (de === Ao ? Ce : zr).source + "|" + (s.evaluate || zr).source + "|$",
            "g"
          ), Ue = "//# sourceURL=" + (Qt.call(s, "sourceURL") ? (s.sourceURL + "").replace(/\s/g, " ") : "lodash.templateSources[" + ++B3 + "]") + `
`;
          i.replace(Pe, function(Qe, St, Dt, Hn, dn, Wn) {
            return Dt || (Dt = Hn), be += i.slice(fe, Wn).replace(Mr, n5), St && (I = !0, be += `' +
__e(` + St + `) +
'`), dn && (re = !0, be += `';
` + dn + `;
__p += '`), Dt && (be += `' +
((__t = (` + Dt + `)) == null ? '' : __t) +
'`), fe = Wn + Qe.length, Qe;
          }), be += `';
`;
          var Je = Qt.call(s, "variable") && s.variable;
          if (!Je)
            be = `with (obj) {
` + be + `
}
`;
          else if (ce.test(Je))
            throw new lt(u);
          be = (re ? be.replace(Ka, "") : be).replace(un, "$1").replace(Ja, "$1;"), be = "function(" + (Je || "obj") + `) {
` + (Je ? "" : `obj || (obj = {});
`) + "var __t, __p = ''" + (I ? ", __e = _.escape" : "") + (re ? `, __j = Array.prototype.join;
function print() { __p += __j.call(arguments, '') }
` : `;
`) + be + `return __p
}`;
          var pt = wy(function() {
            return It(P, Ue + "return " + be).apply(r, A);
          });
          if (pt.source = be, p0(pt))
            throw pt;
          return pt;
        }
        function TS(i) {
          return Vt(i).toLowerCase();
        }
        function NS(i) {
          return Vt(i).toUpperCase();
        }
        function FS(i, s, p) {
          if (i = Vt(i), i && (p || s === r))
            return Nm(i);
          if (!i || !(s = Un(s)))
            return i;
          var b = Ri(i), C = Ri(s), P = Fm(b, C), A = Pm(b, C) + 1;
          return lo(b, P, A).join("");
        }
        function PS(i, s, p) {
          if (i = Vt(i), i && (p || s === r))
            return i.slice(0, Dm(i) + 1);
          if (!i || !(s = Un(s)))
            return i;
          var b = Ri(i), C = Pm(b, Ri(s)) + 1;
          return lo(b, 0, C).join("");
        }
        function zS(i, s, p) {
          if (i = Vt(i), i && (p || s === r))
            return i.replace(ze, "");
          if (!i || !(s = Un(s)))
            return i;
          var b = Ri(i), C = Fm(b, Ri(s));
          return lo(b, C).join("");
        }
        function DS(i, s) {
          var p = $, b = L;
          if (xr(s)) {
            var C = "separator" in s ? s.separator : C;
            p = "length" in s ? ht(s.length) : p, b = "omission" in s ? Un(s.omission) : b;
          }
          i = Vt(i);
          var P = i.length;
          if (Jl(i)) {
            var A = Ri(i);
            P = A.length;
          }
          if (p >= P)
            return i;
          var I = p - Ql(b);
          if (I < 1)
            return b;
          var re = A ? lo(A, 0, I).join("") : i.slice(0, I);
          if (C === r)
            return re + b;
          if (A && (I += re.length - I), g0(C)) {
            if (i.slice(I).search(C)) {
              var fe, de = re;
              for (C.global || (C = Ph(C.source, Vt(ft.exec(C)) + "g")), C.lastIndex = 0; fe = C.exec(de); )
                var be = fe.index;
              re = re.slice(0, be === r ? I : be);
            }
          } else if (i.indexOf(Un(C), I) != I) {
            var Pe = re.lastIndexOf(C);
            Pe > -1 && (re = re.slice(0, Pe));
          }
          return re + b;
        }
        function OS(i) {
          return i = Vt(i), i && Wl.test(i) ? i.replace(Lo, c5) : i;
        }
        var LS = os(function(i, s, p) {
          return i + (p ? " " : "") + s.toUpperCase();
        }), b0 = _1("toUpperCase");
        function xy(i, s, p) {
          return i = Vt(i), s = p ? r : s, s === r ? a5(i) ? h5(i) : Z3(i) : i.match(s) || [];
        }
        var wy = bt(function(i, s) {
          try {
            return jn(i, r, s);
          } catch (p) {
            return p0(p) ? p : new lt(p);
          }
        }), BS = _a(function(i, s) {
          return ii(s, function(p) {
            p = Zi(p), xa(i, p, h0(i[p], i));
          }), i;
        });
        function AS(i) {
          var s = i == null ? 0 : i.length, p = Ke();
          return i = s ? gr(i, function(b) {
            if (typeof b[1] != "function")
              throw new ai(l);
            return [p(b[0]), b[1]];
          }) : [], bt(function(b) {
            for (var C = -1; ++C < s; ) {
              var P = i[C];
              if (jn(P[0], this, b))
                return jn(P[1], this, b);
            }
          });
        }
        function qS(i) {
          return c4(li(i, d));
        }
        function x0(i) {
          return function() {
            return i;
          };
        }
        function jS(i, s) {
          return i == null || i !== i ? s : i;
        }
        var $S = S1(), US = S1(!0);
        function Cn(i) {
          return i;
        }
        function w0(i) {
          return e1(typeof i == "function" ? i : li(i, d));
        }
        function IS(i) {
          return r1(li(i, d));
        }
        function HS(i, s) {
          return n1(i, li(s, d));
        }
        var WS = bt(function(i, s) {
          return function(p) {
            return uu(p, i, s);
          };
        }), GS = bt(function(i, s) {
          return function(p) {
            return uu(i, p, s);
          };
        });
        function _0(i, s, p) {
          var b = Ir(s), C = Jc(s, b);
          p == null && !(xr(s) && (C.length || !b.length)) && (p = s, s = i, i = this, C = Jc(s, Ir(s)));
          var P = !(xr(p) && "chain" in p) || !!p.chain, A = Sa(i);
          return ii(C, function(I) {
            var re = s[I];
            i[I] = re, A && (i.prototype[I] = function() {
              var fe = this.__chain__;
              if (P || fe) {
                var de = i(this.__wrapped__), be = de.__actions__ = _n(this.__actions__);
                return be.push({ func: re, args: arguments, thisArg: i }), de.__chain__ = fe, de;
              }
              return re.apply(i, to([this.value()], arguments));
            });
          }), i;
        }
        function VS() {
          return Xr._ === this && (Xr._ = b5), this;
        }
        function k0() {
        }
        function XS(i) {
          return i = ht(i), bt(function(s) {
            return i1(s, i);
          });
        }
        var YS = e0(gr), ZS = e0(Cm), KS = e0(Ch);
        function _y(i) {
          return l0(i) ? Eh(Zi(i)) : M4(i);
        }
        function JS(i) {
          return function(s) {
            return i == null ? r : Go(i, s);
          };
        }
        var QS = E1(), eC = E1(!0);
        function S0() {
          return [];
        }
        function C0() {
          return !1;
        }
        function tC() {
          return {};
        }
        function rC() {
          return "";
        }
        function nC() {
          return !0;
        }
        function iC(i, s) {
          if (i = ht(i), i < 1 || i > K)
            return [];
          var p = Z, b = Jr(i, Z);
          s = Ke(s), i -= Z;
          for (var C = Th(b, s); ++p < i; )
            s(p);
          return C;
        }
        function aC(i) {
          return ct(i) ? gr(i, Zi) : In(i) ? [i] : _n(U1(Vt(i)));
        }
        function oC(i) {
          var s = ++m5;
          return Vt(i) + s;
        }
        var lC = af(function(i, s) {
          return i + s;
        }, 0), sC = t0("ceil"), uC = af(function(i, s) {
          return i / s;
        }, 1), cC = t0("floor");
        function fC(i) {
          return i && i.length ? Kc(i, Cn, jh) : r;
        }
        function dC(i, s) {
          return i && i.length ? Kc(i, Ke(s, 2), jh) : r;
        }
        function hC(i) {
          return Rm(i, Cn);
        }
        function vC(i, s) {
          return Rm(i, Ke(s, 2));
        }
        function pC(i) {
          return i && i.length ? Kc(i, Cn, Hh) : r;
        }
        function gC(i, s) {
          return i && i.length ? Kc(i, Ke(s, 2), Hh) : r;
        }
        var mC = af(function(i, s) {
          return i * s;
        }, 1), yC = t0("round"), bC = af(function(i, s) {
          return i - s;
        }, 0);
        function xC(i) {
          return i && i.length ? Rh(i, Cn) : 0;
        }
        function wC(i, s) {
          return i && i.length ? Rh(i, Ke(s, 2)) : 0;
        }
        return F.after = I8, F.ary = Q1, F.assign = N7, F.assignIn = hy, F.assignInWith = yf, F.assignWith = F7, F.at = P7, F.before = ey, F.bind = h0, F.bindAll = BS, F.bindKey = ty, F.castArray = t7, F.chain = Z1, F.chunk = c6, F.compact = f6, F.concat = d6, F.cond = AS, F.conforms = qS, F.constant = x0, F.countBy = x8, F.create = z7, F.curry = ry, F.curryRight = ny, F.debounce = iy, F.defaults = D7, F.defaultsDeep = O7, F.defer = H8, F.delay = W8, F.difference = h6, F.differenceBy = v6, F.differenceWith = p6, F.drop = g6, F.dropRight = m6, F.dropRightWhile = y6, F.dropWhile = b6, F.fill = x6, F.filter = _8, F.flatMap = C8, F.flatMapDeep = E8, F.flatMapDepth = M8, F.flatten = G1, F.flattenDeep = w6, F.flattenDepth = _6, F.flip = G8, F.flow = $S, F.flowRight = US, F.fromPairs = k6, F.functions = U7, F.functionsIn = I7, F.groupBy = R8, F.initial = C6, F.intersection = E6, F.intersectionBy = M6, F.intersectionWith = R6, F.invert = W7, F.invertBy = G7, F.invokeMap = N8, F.iteratee = w0, F.keyBy = F8, F.keys = Ir, F.keysIn = Sn, F.map = df, F.mapKeys = X7, F.mapValues = Y7, F.matches = IS, F.matchesProperty = HS, F.memoize = vf, F.merge = Z7, F.mergeWith = vy, F.method = WS, F.methodOf = GS, F.mixin = _0, F.negate = pf, F.nthArg = XS, F.omit = K7, F.omitBy = J7, F.once = V8, F.orderBy = P8, F.over = YS, F.overArgs = X8, F.overEvery = ZS, F.overSome = KS, F.partial = v0, F.partialRight = ay, F.partition = z8, F.pick = Q7, F.pickBy = py, F.property = _y, F.propertyOf = JS, F.pull = P6, F.pullAll = X1, F.pullAllBy = z6, F.pullAllWith = D6, F.pullAt = O6, F.range = QS, F.rangeRight = eC, F.rearg = Y8, F.reject = L8, F.remove = L6, F.rest = Z8, F.reverse = f0, F.sampleSize = A8, F.set = tS, F.setWith = rS, F.shuffle = q8, F.slice = B6, F.sortBy = U8, F.sortedUniq = H6, F.sortedUniqBy = W6, F.split = CS, F.spread = K8, F.tail = G6, F.take = V6, F.takeRight = X6, F.takeRightWhile = Y6, F.takeWhile = Z6, F.tap = f8, F.throttle = J8, F.thru = ff, F.toArray = cy, F.toPairs = gy, F.toPairsIn = my, F.toPath = aC, F.toPlainObject = dy, F.transform = nS, F.unary = Q8, F.union = K6, F.unionBy = J6, F.unionWith = Q6, F.uniq = e8, F.uniqBy = t8, F.uniqWith = r8, F.unset = iS, F.unzip = d0, F.unzipWith = Y1, F.update = aS, F.updateWith = oS, F.values = us, F.valuesIn = lS, F.without = n8, F.words = xy, F.wrap = e7, F.xor = i8, F.xorBy = a8, F.xorWith = o8, F.zip = l8, F.zipObject = s8, F.zipObjectDeep = u8, F.zipWith = c8, F.entries = gy, F.entriesIn = my, F.extend = hy, F.extendWith = yf, _0(F, F), F.add = lC, F.attempt = wy, F.camelCase = fS, F.capitalize = yy, F.ceil = sC, F.clamp = sS, F.clone = r7, F.cloneDeep = i7, F.cloneDeepWith = a7, F.cloneWith = n7, F.conformsTo = o7, F.deburr = by, F.defaultTo = jS, F.divide = uC, F.endsWith = dS, F.eq = Ni, F.escape = hS, F.escapeRegExp = vS, F.every = w8, F.find = k8, F.findIndex = H1, F.findKey = L7, F.findLast = S8, F.findLastIndex = W1, F.findLastKey = B7, F.floor = cC, F.forEach = K1, F.forEachRight = J1, F.forIn = A7, F.forInRight = q7, F.forOwn = j7, F.forOwnRight = $7, F.get = m0, F.gt = l7, F.gte = s7, F.has = H7, F.hasIn = y0, F.head = V1, F.identity = Cn, F.includes = T8, F.indexOf = S6, F.inRange = uS, F.invoke = V7, F.isArguments = Yo, F.isArray = ct, F.isArrayBuffer = u7, F.isArrayLike = kn, F.isArrayLikeObject = Rr, F.isBoolean = c7, F.isBuffer = so, F.isDate = f7, F.isElement = d7, F.isEmpty = h7, F.isEqual = v7, F.isEqualWith = p7, F.isError = p0, F.isFinite = g7, F.isFunction = Sa, F.isInteger = oy, F.isLength = gf, F.isMap = ly, F.isMatch = m7, F.isMatchWith = y7, F.isNaN = b7, F.isNative = x7, F.isNil = _7, F.isNull = w7, F.isNumber = sy, F.isObject = xr, F.isObjectLike = _r, F.isPlainObject = pu, F.isRegExp = g0, F.isSafeInteger = k7, F.isSet = uy, F.isString = mf, F.isSymbol = In, F.isTypedArray = ss, F.isUndefined = S7, F.isWeakMap = C7, F.isWeakSet = E7, F.join = T6, F.kebabCase = pS, F.last = ui, F.lastIndexOf = N6, F.lowerCase = gS, F.lowerFirst = mS, F.lt = M7, F.lte = R7, F.max = fC, F.maxBy = dC, F.mean = hC, F.meanBy = vC, F.min = pC, F.minBy = gC, F.stubArray = S0, F.stubFalse = C0, F.stubObject = tC, F.stubString = rC, F.stubTrue = nC, F.multiply = mC, F.nth = F6, F.noConflict = VS, F.noop = k0, F.now = hf, F.pad = yS, F.padEnd = bS, F.padStart = xS, F.parseInt = wS, F.random = cS, F.reduce = D8, F.reduceRight = O8, F.repeat = _S, F.replace = kS, F.result = eS, F.round = yC, F.runInContext = J, F.sample = B8, F.size = j8, F.snakeCase = SS, F.some = $8, F.sortedIndex = A6, F.sortedIndexBy = q6, F.sortedIndexOf = j6, F.sortedLastIndex = $6, F.sortedLastIndexBy = U6, F.sortedLastIndexOf = I6, F.startCase = ES, F.startsWith = MS, F.subtract = bC, F.sum = xC, F.sumBy = wC, F.template = RS, F.times = iC, F.toFinite = Ca, F.toInteger = ht, F.toLength = fy, F.toLower = TS, F.toNumber = ci, F.toSafeInteger = T7, F.toString = Vt, F.toUpper = NS, F.trim = FS, F.trimEnd = PS, F.trimStart = zS, F.truncate = DS, F.unescape = OS, F.uniqueId = oC, F.upperCase = LS, F.upperFirst = b0, F.each = K1, F.eachRight = J1, F.first = V1, _0(F, function() {
          var i = {};
          return Xi(F, function(s, p) {
            Qt.call(F.prototype, p) || (i[p] = s);
          }), i;
        }(), { chain: !1 }), F.VERSION = n, ii(["bind", "bindKey", "curry", "curryRight", "partial", "partialRight"], function(i) {
          F[i].placeholder = F;
        }), ii(["drop", "take"], function(i, s) {
          Nt.prototype[i] = function(p) {
            p = p === r ? 1 : qr(ht(p), 0);
            var b = this.__filtered__ && !s ? new Nt(this) : this.clone();
            return b.__filtered__ ? b.__takeCount__ = Jr(p, b.__takeCount__) : b.__views__.push({
              size: Jr(p, Z),
              type: i + (b.__dir__ < 0 ? "Right" : "")
            }), b;
          }, Nt.prototype[i + "Right"] = function(p) {
            return this.reverse()[i](p).reverse();
          };
        }), ii(["filter", "map", "takeWhile"], function(i, s) {
          var p = s + 1, b = p == W || p == G;
          Nt.prototype[i] = function(C) {
            var P = this.clone();
            return P.__iteratees__.push({
              iteratee: Ke(C, 3),
              type: p
            }), P.__filtered__ = P.__filtered__ || b, P;
          };
        }), ii(["head", "last"], function(i, s) {
          var p = "take" + (s ? "Right" : "");
          Nt.prototype[i] = function() {
            return this[p](1).value()[0];
          };
        }), ii(["initial", "tail"], function(i, s) {
          var p = "drop" + (s ? "" : "Right");
          Nt.prototype[i] = function() {
            return this.__filtered__ ? new Nt(this) : this[p](1);
          };
        }), Nt.prototype.compact = function() {
          return this.filter(Cn);
        }, Nt.prototype.find = function(i) {
          return this.filter(i).head();
        }, Nt.prototype.findLast = function(i) {
          return this.reverse().find(i);
        }, Nt.prototype.invokeMap = bt(function(i, s) {
          return typeof i == "function" ? new Nt(this) : this.map(function(p) {
            return uu(p, i, s);
          });
        }), Nt.prototype.reject = function(i) {
          return this.filter(pf(Ke(i)));
        }, Nt.prototype.slice = function(i, s) {
          i = ht(i);
          var p = this;
          return p.__filtered__ && (i > 0 || s < 0) ? new Nt(p) : (i < 0 ? p = p.takeRight(-i) : i && (p = p.drop(i)), s !== r && (s = ht(s), p = s < 0 ? p.dropRight(-s) : p.take(s - i)), p);
        }, Nt.prototype.takeRightWhile = function(i) {
          return this.reverse().takeWhile(i).reverse();
        }, Nt.prototype.toArray = function() {
          return this.take(Z);
        }, Xi(Nt.prototype, function(i, s) {
          var p = /^(?:filter|find|map|reject)|While$/.test(s), b = /^(?:head|last)$/.test(s), C = F[b ? "take" + (s == "last" ? "Right" : "") : s], P = b || /^find/.test(s);
          C && (F.prototype[s] = function() {
            var A = this.__wrapped__, I = b ? [1] : arguments, re = A instanceof Nt, fe = I[0], de = re || ct(A), be = function(St) {
              var Dt = C.apply(F, to([St], I));
              return b && Pe ? Dt[0] : Dt;
            };
            de && p && typeof fe == "function" && fe.length != 1 && (re = de = !1);
            var Pe = this.__chain__, Ue = !!this.__actions__.length, Je = P && !Pe, pt = re && !Ue;
            if (!P && de) {
              A = pt ? A : new Nt(this);
              var Qe = i.apply(A, I);
              return Qe.__actions__.push({ func: ff, args: [be], thisArg: r }), new oi(Qe, Pe);
            }
            return Je && pt ? i.apply(this, I) : (Qe = this.thru(be), Je ? b ? Qe.value()[0] : Qe.value() : Qe);
          });
        }), ii(["pop", "push", "shift", "sort", "splice", "unshift"], function(i) {
          var s = Lc[i], p = /^(?:push|sort|unshift)$/.test(i) ? "tap" : "thru", b = /^(?:pop|shift)$/.test(i);
          F.prototype[i] = function() {
            var C = arguments;
            if (b && !this.__chain__) {
              var P = this.value();
              return s.apply(ct(P) ? P : [], C);
            }
            return this[p](function(A) {
              return s.apply(ct(A) ? A : [], C);
            });
          };
        }), Xi(Nt.prototype, function(i, s) {
          var p = F[s];
          if (p) {
            var b = p.name + "";
            Qt.call(ns, b) || (ns[b] = []), ns[b].push({ name: s, func: p });
          }
        }), ns[nf(r, _).name] = [{
          name: "wrapper",
          func: r
        }], Nt.prototype.clone = O5, Nt.prototype.reverse = L5, Nt.prototype.value = B5, F.prototype.at = d8, F.prototype.chain = h8, F.prototype.commit = v8, F.prototype.next = p8, F.prototype.plant = m8, F.prototype.reverse = y8, F.prototype.toJSON = F.prototype.valueOf = F.prototype.value = b8, F.prototype.first = F.prototype.head, ru && (F.prototype[ru] = g8), F;
      }, es = v5();
      $o ? (($o.exports = es)._ = es, wh._ = es) : Xr._ = es;
    }).call(_F);
  }(If, If.exports)), If.exports;
}
var tp = kF();
const hk = /* @__PURE__ */ Lg(tp), SF = {
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
class CF {
  #e = /* @__PURE__ */ je(an(SF));
  get config() {
    return D(this.#e);
  }
  set config(e) {
    pe(this.#e, e, !0);
  }
}
const Lb = Symbol("config");
let ar = class {
  static initialize() {
    pi(Lb, new CF());
  }
  static get config() {
    const e = Nn(Lb);
    if (e == null)
      throw new Error("config context not yet set");
    return e.config;
  }
};
class EF {
  tableModel;
  tableController;
  margin = 2;
  isDragging = !1;
  lastDragX = 0;
  #e = /* @__PURE__ */ je(0);
  get elementWidth() {
    return D(this.#e);
  }
  set elementWidth(e) {
    pe(this.#e, e, !0);
  }
  #t = /* @__PURE__ */ Me(() => this.elementWidth - this.margin * 2);
  get scrollbarWidth() {
    return D(this.#t);
  }
  set scrollbarWidth(e) {
    pe(this.#t, e);
  }
  #r = /* @__PURE__ */ Me(() => this.tableController.viewWidth / this.tableModel.colsRightmostPosition * this.scrollbarWidth);
  get pillWidth() {
    return D(this.#r);
  }
  set pillWidth(e) {
    pe(this.#r, e);
  }
  #n = /* @__PURE__ */ Me(() => -this.tableController.xScroll / this.tableModel.colsRightmostPosition * this.scrollbarWidth);
  get pillLeft() {
    return D(this.#n);
  }
  set pillLeft(e) {
    pe(this.#n, e);
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
const Bb = "mosaic-coordinator";
class rp {
  static get coordinator() {
    return Nn(Bb) ?? Nd();
  }
  static set coordinator(e) {
    pi(Bb, e);
  }
}
const Rn = "__oid", MF = 120;
class RF {
  schema;
  #e = /* @__PURE__ */ je(an({}));
  get data() {
    return D(this.#e);
  }
  set data(e) {
    pe(this.#e, e, !0);
  }
  #t = /* @__PURE__ */ je(an({}));
  get defaultColWidths() {
    return D(this.#t);
  }
  set defaultColWidths(e) {
    pe(this.#t, e, !0);
  }
  #r = /* @__PURE__ */ je(an([]));
  get columns() {
    return D(this.#r);
  }
  set columns(e) {
    pe(this.#r, e, !0);
  }
  #n = /* @__PURE__ */ je(0);
  get numRows() {
    return D(this.#n);
  }
  set numRows(e) {
    pe(this.#n, e, !0);
  }
  #u = /* @__PURE__ */ je(0);
  get renderOffset() {
    return D(this.#u);
  }
  set renderOffset(e) {
    pe(this.#u, e, !0);
  }
  #i = /* @__PURE__ */ je(an({}));
  get rowHeightAddition() {
    return D(this.#i);
  }
  set rowHeightAddition(e) {
    pe(this.#i, e, !0);
  }
  #a = /* @__PURE__ */ Me(() => this.columns.reduce(
    (e, r) => (ar.config.columnConfigs[r]?.hidden && e.add(r), r === Rn && ar.config.showRowNumber === !1 && e.add(Rn), e),
    /* @__PURE__ */ new Set()
  ));
  get hiddenColumns() {
    return D(this.#a);
  }
  set hiddenColumns(e) {
    pe(this.#a, e);
  }
  rowKeyColumn = null;
  constructor(e) {
    this.schema = e;
  }
  #l = /* @__PURE__ */ Me(() => Object.keys(this.data).sort((e, r) => this.data[e][Rn] - this.data[r][Rn]));
  get renderableRows() {
    return D(this.#l);
  }
  set renderableRows(e) {
    pe(this.#l, e);
  }
  #o = /* @__PURE__ */ Me(() => this.columns.filter((e) => !this.hiddenColumns.has(e)));
  get renderableCols() {
    return D(this.#o);
  }
  set renderableCols(e) {
    pe(this.#o, e);
  }
  #s = /* @__PURE__ */ Me(() => this.renderableRows.length === 0 ? this.zeroRowPosition : Math.min(...this.renderableRows.map((e) => this.rowPositions[e])));
  get minRowPosition() {
    return D(this.#s);
  }
  set minRowPosition(e) {
    pe(this.#s, e);
  }
  #f = /* @__PURE__ */ Me(() => this.renderableRows.length === 0 ? this.finalRowPosition : Math.max(...this.renderableRows.map((e) => this.rowPositions[e])));
  get maxRowPosition() {
    return D(this.#f);
  }
  set maxRowPosition(e) {
    pe(this.#f, e);
  }
  #c = /* @__PURE__ */ Me(() => {
    const e = Math.min(...this.renderableRows.map((r) => this.data[r][Rn]));
    return Number.isSafeInteger(e) ? e : 0;
  });
  get minRowOID() {
    return D(this.#c);
  }
  set minRowOID(e) {
    pe(this.#c, e);
  }
  #v = /* @__PURE__ */ Me(() => {
    const e = Math.max(...this.renderableRows.map((r) => this.data[r][Rn]));
    return Number.isSafeInteger(e) ? e : 0;
  });
  get maxRowOID() {
    return D(this.#v);
  }
  set maxRowOID(e) {
    pe(this.#v, e);
  }
  #d = /* @__PURE__ */ Me(() => 0);
  get zeroRowPosition() {
    return D(this.#d);
  }
  set zeroRowPosition(e) {
    pe(this.#d, e);
  }
  #h = /* @__PURE__ */ Me(() => (this.numRows - 1) * ar.config.rowHeight + this.rowPositionOffsets.cumulative);
  get finalRowPosition() {
    return D(this.#h);
  }
  set finalRowPosition(e) {
    pe(this.#h, e);
  }
  colsLeftmostPosition = 0;
  #p = /* @__PURE__ */ Me(() => {
    const e = this.renderableCols[this.renderableCols.length - 1];
    return this.colPositions[e] + this.colWidths[e];
  });
  get colsRightmostPosition() {
    return D(this.#p);
  }
  set colsRightmostPosition(e) {
    pe(this.#p, e);
  }
  #g = /* @__PURE__ */ Me(() => this.renderableRows.reduce(
    ({ offsets: e, cumulative: r }, n) => {
      e[n] = r;
      const a = this.rowHeightAddition[n] ?? 0;
      return { offsets: e, cumulative: r + a };
    },
    { offsets: {}, cumulative: 0 }
  ));
  get rowPositionOffsets() {
    return D(this.#g);
  }
  set rowPositionOffsets(e) {
    pe(this.#g, e);
  }
  #m = /* @__PURE__ */ Me(() => this.renderableRows.reduce(
    (e, r) => {
      const n = (this.data[r][Rn] - 1) * ar.config.rowHeight + this.rowPositionOffsets.offsets[r];
      return e[r] = n, e;
    },
    {}
  ));
  get rowPositions() {
    return D(this.#m);
  }
  set rowPositions(e) {
    pe(this.#m, e);
  }
  #y = /* @__PURE__ */ Me(() => {
    let e = 0;
    return this.columns.reduce(
      (r, n, a) => (this.hiddenColumns.has(n) || (r[n] = e, e += this.colWidths[n]), r),
      {}
    );
  });
  get colPositions() {
    return D(this.#y);
  }
  set colPositions(e) {
    pe(this.#y, e);
  }
  #b = /* @__PURE__ */ Me(() => this.renderableRows.reduce(
    (e, r) => (e[r] = ar.config.rowHeight + (this.rowHeightAddition[r] ?? 0), e),
    {}
  ));
  get rowHeights() {
    return D(this.#b);
  }
  set rowHeights(e) {
    pe(this.#b, e);
  }
  #x = /* @__PURE__ */ Me(() => this.columns.reduce(
    (e, r, n) => (e[r] = Math.max(ar.config.columnConfigs[r]?.width ?? this.defaultColWidths[r] ?? MF, ar.config.minColumnWidths[r] ?? 0), this.isFirstCol(r) && (e[r] += ar.config.firstColLeftPadding), this.isLastCol(r) && (e[r] += ar.config.verticalScrollbarWidth), e),
    {}
  ));
  get colWidths() {
    return D(this.#x);
  }
  set colWidths(e) {
    pe(this.#x, e);
  }
  getContent({ row: e, col: r }) {
    return this.data[e] ? this.data[e][r] : null;
  }
  getRowData(e) {
    return this.data[e] ? this.data[e] : null;
  }
  getPosition({ row: e, col: r }) {
    const n = this.colPositions[r], a = this.rowPositions[e];
    return { x: n, y: a };
  }
  getDimensions({ row: e, col: r }) {
    const n = this.colWidths[r], a = this.rowHeights[e];
    return { width: n, height: a };
  }
  getRowParity(e) {
    return this.data[e] && this.data[e][Rn] % 2 === 0 ? "even" : "odd";
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
class TF extends Fd {
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
    return Ps.from(this.tableName).select({ count: MC() }).where(e);
  }
}
const Tn = "__oid";
class NF extends Fd {
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
  constructor(e, r, n, a, o) {
    super(n ?? void 0), this.tableName = e, this.columns = r, this.onResult = a, this.onColumnInfo = o;
  }
  async prepare() {
    if (this.coordinator == null)
      return;
    const e = (await _C(this.coordinator, [{ table: this.tableName, column: "*" }])).reduce((r, n) => (r[n.column] = n, r), {});
    this.columnInfo = e, this.onColumnInfo(e), this.isReady = !0;
  }
  getSelect({ includeRowNumber: e } = { includeRowNumber: !0 }) {
    const r = this.columns.reduce((n, a) => (this.columnInfo?.[a]?.sqlType === "BIGINT" ? n[a] = Sy(co(a), "TEXT") : n[a] = co(a), n), {});
    return e || delete r[Tn], r;
  }
  queryResult(e) {
    return this.onResult(e), this;
  }
  query(e = []) {
    if (!this.isReady)
      return null;
    const r = this.columns.reduce((n, a) => (this.columnInfo?.[a]?.sqlType === "BIGINT" ? n[a] = Sy(co(a), "TEXT") : n[a] = co(a), n), {});
    if (r[Tn] = CC(), this.sort) {
      const n = this.sort.direction === "ascending" ? this.sort.column : EC(this.sort.column);
      r[Tn] = r[Tn].orderby(n);
    }
    return Ps.from(this.tableName).select(r).where(e).limit(this.limit).offset(this.offset);
  }
  fetchRows(e, r) {
    this.offset = e, this.limit = r, this.requestUpdate();
  }
}
class FF {
  model;
  schema;
  config;
  #e = /* @__PURE__ */ Me(() => rp.coordinator);
  get coordinator() {
    return D(this.#e);
  }
  set coordinator(e) {
    pe(this.#e, e);
  }
  filterBy = null;
  rowsClient = null;
  numRowsClient = null;
  rowKeyColumn = null;
  #t = /* @__PURE__ */ je(null);
  get element() {
    return D(this.#t);
  }
  set element(e) {
    pe(this.#t, e, !0);
  }
  #r = /* @__PURE__ */ je(0);
  get viewHeight() {
    return D(this.#r);
  }
  set viewHeight(e) {
    pe(this.#r, e, !0);
  }
  #n = /* @__PURE__ */ je(0);
  get viewWidth() {
    return D(this.#n);
  }
  set viewWidth(e) {
    pe(this.#n, e, !0);
  }
  #u = /* @__PURE__ */ je(0);
  get yScroll() {
    return D(this.#u);
  }
  set yScroll(e) {
    pe(this.#u, e, !0);
  }
  #i = /* @__PURE__ */ je(0);
  get xScroll() {
    return D(this.#i);
  }
  set xScroll(e) {
    pe(this.#i, e, !0);
  }
  #a = /* @__PURE__ */ je(!1);
  get isFetching() {
    return D(this.#a);
  }
  set isFetching(e) {
    pe(this.#a, e, !0);
  }
  #l = /* @__PURE__ */ je(!1);
  get isJumping() {
    return D(this.#l);
  }
  set isJumping(e) {
    pe(this.#l, e, !0);
  }
  #o = /* @__PURE__ */ je(null);
  get sort() {
    return D(this.#o);
  }
  set sort(e) {
    pe(this.#o, e, !0);
  }
  #s = /* @__PURE__ */ je(!1);
  get isReady() {
    return D(this.#s);
  }
  set isReady(e) {
    pe(this.#s, e, !0);
  }
  #f = /* @__PURE__ */ je(0);
  get updateKey() {
    return D(this.#f);
  }
  set updateKey(e) {
    pe(this.#f, e, !0);
  }
  #c = /* @__PURE__ */ je(!1);
  get isStale() {
    return D(this.#c);
  }
  set isStale(e) {
    pe(this.#c, e, !0);
  }
  #v = /* @__PURE__ */ je(null);
  get flashedRowId() {
    return D(this.#v);
  }
  set flashedRowId(e) {
    pe(this.#v, e, !0);
  }
  #d = /* @__PURE__ */ je(null);
  get hoveredRowId() {
    return D(this.#d);
  }
  set hoveredRowId(e) {
    pe(this.#d, e, !0);
  }
  #h = /* @__PURE__ */ Me(() => Math.ceil(this.viewHeight / ar.config.rowHeight));
  get rowsOnScreen() {
    return D(this.#h);
  }
  set rowsOnScreen(e) {
    pe(this.#h, e);
  }
  #p = /* @__PURE__ */ Me(() => this.isJumping ? 0 : ar.config.renderWindowOffset);
  get renderWindowOffset() {
    return D(this.#p);
  }
  set renderWindowOffset(e) {
    pe(this.#p, e);
  }
  #g = /* @__PURE__ */ Me(() => {
    if (this.model.renderableRows.length === 0)
      return null;
    const e = this.model.renderableRows.filter((n) => {
      const a = this.model.rowPositions[n] + this.yScroll;
      return a + this.model.rowHeights[n] > 0 && a < this.viewHeight;
    });
    if (e.length === 0)
      return null;
    const r = e[0];
    return this.model.data[r][Tn];
  });
  get firstVisibleRowOID() {
    return D(this.#g);
  }
  set firstVisibleRowOID(e) {
    pe(this.#g, e);
  }
  #m = /* @__PURE__ */ Me(() => Math.max(0, Math.floor(-this.yScroll / ar.config.rowHeight)));
  get offset() {
    return D(this.#m);
  }
  set offset(e) {
    pe(this.#m, e);
  }
  onFetchResolveBegin = null;
  onFetchResolveEnd = null;
  constructor(e, r) {
    this.model = e, this.schema = r, this.config = ar.config;
  }
  handleFilterBy = () => {
    this.rowsClient && (this.rowsClient.offset = 0, this.rowsClient.limit = this.rowsOnScreen, this.isJumping = !0, this.markStale());
  };
  updateData = (e) => {
    if (!this.model || !this.rowKeyColumn)
      return;
    this.onFetchResolveBegin && (this.onFetchResolveBegin(), this.onFetchResolveBegin = null);
    const r = e.toArray(), n = {};
    for (const a of r) {
      const o = a[this.rowKeyColumn];
      n[o] = a;
    }
    this.model.data = { ...this.model.data, ...n }, this.onFetchResolveEnd && (this.onFetchResolveEnd(), this.onFetchResolveEnd = null), this.isFetching = !1;
  };
  initialize({ tableName: e, rowKey: r, columns: n, filterBy: a }) {
    if (this.model.columns = n, this.model.rowKeyColumn = r, this.rowKeyColumn = r, a && (this.filterBy = a, this.filterBy.addEventListener("value", this.handleFilterBy)), !this.rowKeyColumn)
      throw new Error("rowkey cannot be null");
    let o = n.includes(this.rowKeyColumn) ? n : [...n, this.rowKeyColumn];
    this.rowsClient = new NF(
      e,
      o,
      a,
      (l) => {
        this.updateData(l);
      },
      (l) => {
        this.schema.columnInfo = l, this.computeColWidths(e, n), this.isReady = !0;
      }
    ), this.coordinator.connect(this.rowsClient), this.numRowsClient = new TF(e, a, (l) => {
      this.model && (this.model.numRows = l);
    }), this.coordinator.connect(this.numRowsClient), wr(() => {
      if (!this.rowsClient || this.isFetching || !this.isReady)
        return;
      const l = -this.renderWindowOffset, u = this.viewHeight + this.renderWindowOffset, c = this.model.maxRowPosition + this.yScroll + this.config.rowHeight, f = this.model.minRowPosition + this.yScroll;
      if (f < 0 && c < 0 || f > this.viewHeight && c > this.viewHeight) {
        const w = this.rowsOnScreen;
        this.isFetching = !0, this.rowsClient.fetchRows(this.offset, w);
      } else {
        if (c < u) {
          const x = tp.clamp(Math.ceil((u - c) / this.config.rowHeight), this.config.minFetchSize, this.rowsOnScreen);
          x > 0 && this.model.maxRowOID !== this.model.numRows && (this.isFetching = !0, this.rowsClient.fetchRows(this.model.maxRowOID, x));
        }
        const w = this.model.minRowPosition + this.yScroll;
        if (w > l && this.model.minRowOID !== 1) {
          const x = tp.clamp(Math.ceil((w - l) / this.config.rowHeight), this.config.minFetchSize, this.rowsOnScreen);
          x > 0 && (this.isFetching = !0, this.rowsClient.fetchRows(Math.max(0, this.model.minRowOID - 1 - x), x));
        }
      }
      const h = N_(this.model.renderableRows);
      let d = 0;
      for (; this.model.rowPositions[h[d]] + this.yScroll + this.model.rowHeights[h[d]] < 0; )
        this.yScroll += this.model.collapseRow(h[d]), d += 1;
      let g = h.length - 1;
      for (; this.model.rowPositions[h[g]] + this.yScroll > this.viewHeight; )
        this.model.collapseRow(h[g]), g -= 1;
      let m = 0;
      for (; this.model.rowPositions[h[m]] + this.yScroll + this.model.rowHeights[h[m]] < l; )
        this.model.deleteRow(h[m]), m += 1;
      let y = h.length - 1;
      for (; this.model.rowPositions[h[y]] + this.yScroll > u; )
        this.model.deleteRow(h[y]), y -= 1;
    });
  }
  teardown() {
    this.filterBy && this.filterBy.removeEventListener("value", this.handleFilterBy);
  }
  cellIsVisible(e) {
    const { x: r, y: n } = this.model.getPosition(e), { width: a, height: o } = this.model.getDimensions(e), l = r + this.xScroll, u = n + this.yScroll;
    return l + a >= 0 && l <= this.viewWidth && u + o >= 0 && u <= this.viewHeight;
  }
  rowIsVisible(e) {
    const r = this.model.rowPositions[e], n = this.model.rowHeights[e], a = r + this.yScroll;
    return a + n >= 0 && a <= this.viewHeight;
  }
  rowStillExists(e) {
    return this.model.data[e] != null;
  }
  colIsVisible(e) {
    const r = this.model.colPositions[e], n = this.model.colWidths[e], a = r + this.xScroll;
    return a + n >= 0 && a <= this.viewWidth;
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
    const n = Ps.with({
      original: this.rowsClient.query(this.rowsClient.filterBy?.predicate(this.rowsClient)).offset(0).limit(this.model.numRows)
    }).select([Tn]).from("original").where(SC(co(this.rowKeyColumn), tw(e))), a = (await this.coordinator.query(n)).toArray();
    if (a.length > 0) {
      const o = a[0][Tn] - 1;
      this.onFetchResolveEnd = () => {
        r && this.flashRow(e);
      }, this.jumpToOffset(o);
    } else
      this.isFetching = !1, console.error("no row", e, "found");
  }
  addHeightToRow(e, r) {
    this.model.rowHeightAddition[e] = (this.model.rowHeightAddition[e] ?? 0) + r;
  }
  hideColumn(e) {
    e === Tn ? this.config.onShowRowNumberChange ? this.config.onShowRowNumberChange(!1) : this.config.showRowNumber = !1 : (this.config.columnConfigs[e] || (this.config.columnConfigs[e] = {}), this.config.columnConfigs[e].hidden = !0);
  }
  showColumn(e) {
    e === Tn ? this.config.onShowRowNumberChange ? this.config.onShowRowNumberChange(!0) : this.config.showRowNumber = !0 : (this.config.columnConfigs[e] || (this.config.columnConfigs[e] = {}), this.config.columnConfigs[e].hidden = !1);
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
    const n = r.filter((c) => c !== Tn), a = this.rowsClient?.getSelect({ includeRowNumber: !1 }), o = n.reduce(
      (c, f) => (c[f] = 0, c),
      {}
    ), l = Ps.from(e).select(a).offset(0).limit(10), u = (await this.coordinator.query(l)).toArray();
    for (const c of u)
      for (const f of n)
        o[f] = Math.max(o[f], PF(c[f]));
    r.includes(Tn) && (o[Tn] = this.config.DEFAULT_ROW_NUMBER_COL_WIDTH), this.model.defaultColWidths = o;
  }
}
function PF(t) {
  const e = String(t).length;
  return e > 200 ? 600 : e > 100 ? 300 : e > 20 ? 200 : e > 10 ? 150 : 120;
}
class zF {
  tableController;
  #e = /* @__PURE__ */ Me(() => this.tableController.element);
  get tableElement() {
    return D(this.#e);
  }
  set tableElement(e) {
    pe(this.#e, e);
  }
  constructor(e) {
    this.tableController = e;
  }
  mount(e, r, n, a, o) {
    if (!this.tableElement)
      return;
    const l = r.getBoundingClientRect(), u = this.tableElement.getBoundingClientRect(), c = u.top, f = u.left;
    switch (n) {
      case "inside":
        switch (o) {
          case "top":
            e.style.top = l.top - c + "px";
            break;
          case "middle":
          case "bottom":
            throw new Error("not yet implemented" + n + o);
        }
        switch (a) {
          case "left":
            e.style.left = l.left - f + "px";
          case "center":
          case "right":
            throw new Error("not yet implemented" + n + a);
        }
        break;
      case "outside":
        switch (o) {
          case "top":
            e.style.top = l.bottom - c + "px";
            break;
          case "middle":
          case "bottom":
            throw new Error("not yet implemented" + n + o);
        }
        switch (a) {
          case "left":
            e.style.left = l.left - f + "px";
            break;
          case "center":
          case "right":
            throw new Error("not yet implemented" + n + a);
        }
        break;
    }
    this.tableElement.appendChild(e);
  }
  destroy(e) {
    this.tableElement && this.tableElement.contains(e) && this.tableElement.removeChild(e);
  }
}
var V0, Ab;
function DF() {
  if (Ab) return V0;
  Ab = 1;
  function t(e, r, n) {
    return e === e && (n !== void 0 && (e = e <= n ? e : n), r !== void 0 && (e = e >= r ? e : r)), e;
  }
  return V0 = t, V0;
}
var X0, qb;
function OF() {
  if (qb) return X0;
  qb = 1;
  var t = /\s/;
  function e(r) {
    for (var n = r.length; n-- && t.test(r.charAt(n)); )
      ;
    return n;
  }
  return X0 = e, X0;
}
var Y0, jb;
function LF() {
  if (jb) return Y0;
  jb = 1;
  var t = OF(), e = /^\s+/;
  function r(n) {
    return n && n.slice(0, t(n) + 1).replace(e, "");
  }
  return Y0 = r, Y0;
}
var Z0, $b;
function Bg() {
  if ($b) return Z0;
  $b = 1;
  function t(e) {
    var r = typeof e;
    return e != null && (r == "object" || r == "function");
  }
  return Z0 = t, Z0;
}
var K0, Ub;
function BF() {
  if (Ub) return K0;
  Ub = 1;
  var t = typeof mo == "object" && mo && mo.Object === Object && mo;
  return K0 = t, K0;
}
var J0, Ib;
function vk() {
  if (Ib) return J0;
  Ib = 1;
  var t = BF(), e = typeof self == "object" && self && self.Object === Object && self, r = t || e || Function("return this")();
  return J0 = r, J0;
}
var Q0, Hb;
function pk() {
  if (Hb) return Q0;
  Hb = 1;
  var t = vk(), e = t.Symbol;
  return Q0 = e, Q0;
}
var ev, Wb;
function AF() {
  if (Wb) return ev;
  Wb = 1;
  var t = pk(), e = Object.prototype, r = e.hasOwnProperty, n = e.toString, a = t ? t.toStringTag : void 0;
  function o(l) {
    var u = r.call(l, a), c = l[a];
    try {
      l[a] = void 0;
      var f = !0;
    } catch {
    }
    var h = n.call(l);
    return f && (u ? l[a] = c : delete l[a]), h;
  }
  return ev = o, ev;
}
var tv, Gb;
function qF() {
  if (Gb) return tv;
  Gb = 1;
  var t = Object.prototype, e = t.toString;
  function r(n) {
    return e.call(n);
  }
  return tv = r, tv;
}
var rv, Vb;
function jF() {
  if (Vb) return rv;
  Vb = 1;
  var t = pk(), e = AF(), r = qF(), n = "[object Null]", a = "[object Undefined]", o = t ? t.toStringTag : void 0;
  function l(u) {
    return u == null ? u === void 0 ? a : n : o && o in Object(u) ? e(u) : r(u);
  }
  return rv = l, rv;
}
var nv, Xb;
function $F() {
  if (Xb) return nv;
  Xb = 1;
  function t(e) {
    return e != null && typeof e == "object";
  }
  return nv = t, nv;
}
var iv, Yb;
function UF() {
  if (Yb) return iv;
  Yb = 1;
  var t = jF(), e = $F(), r = "[object Symbol]";
  function n(a) {
    return typeof a == "symbol" || e(a) && t(a) == r;
  }
  return iv = n, iv;
}
var av, Zb;
function gk() {
  if (Zb) return av;
  Zb = 1;
  var t = LF(), e = Bg(), r = UF(), n = NaN, a = /^[-+]0x[0-9a-f]+$/i, o = /^0b[01]+$/i, l = /^0o[0-7]+$/i, u = parseInt;
  function c(f) {
    if (typeof f == "number")
      return f;
    if (r(f))
      return n;
    if (e(f)) {
      var h = typeof f.valueOf == "function" ? f.valueOf() : f;
      f = e(h) ? h + "" : h;
    }
    if (typeof f != "string")
      return f === 0 ? f : +f;
    f = t(f);
    var d = o.test(f);
    return d || l.test(f) ? u(f.slice(2), d ? 2 : 8) : a.test(f) ? n : +f;
  }
  return av = c, av;
}
var ov, Kb;
function IF() {
  if (Kb) return ov;
  Kb = 1;
  var t = DF(), e = gk();
  function r(n, a, o) {
    return o === void 0 && (o = a, a = void 0), o !== void 0 && (o = e(o), o = o === o ? o : 0), a !== void 0 && (a = e(a), a = a === a ? a : 0), t(e(n), a, o);
  }
  return ov = r, ov;
}
var HF = IF();
const WF = /* @__PURE__ */ Lg(HF);
var lv, Jb;
function GF() {
  if (Jb) return lv;
  Jb = 1;
  var t = vk(), e = function() {
    return t.Date.now();
  };
  return lv = e, lv;
}
var sv, Qb;
function VF() {
  if (Qb) return sv;
  Qb = 1;
  var t = Bg(), e = GF(), r = gk(), n = "Expected a function", a = Math.max, o = Math.min;
  function l(u, c, f) {
    var h, d, g, m, y, w, x = 0, _ = !1, S = !1, k = !0;
    if (typeof u != "function")
      throw new TypeError(n);
    c = r(c) || 0, t(f) && (_ = !!f.leading, S = "maxWait" in f, g = S ? a(r(f.maxWait) || 0, c) : g, k = "trailing" in f ? !!f.trailing : k);
    function T(j) {
      var W = h, Y = d;
      return h = d = void 0, x = j, m = u.apply(Y, W), m;
    }
    function E(j) {
      return x = j, y = setTimeout(z, c), _ ? T(j) : m;
    }
    function M(j) {
      var W = j - w, Y = j - x, G = c - W;
      return S ? o(G, g - Y) : G;
    }
    function R(j) {
      var W = j - w, Y = j - x;
      return w === void 0 || W >= c || W < 0 || S && Y >= g;
    }
    function z() {
      var j = e();
      if (R(j))
        return B(j);
      y = setTimeout(z, M(j));
    }
    function B(j) {
      return y = void 0, k && h ? T(j) : (h = d = void 0, m);
    }
    function $() {
      y !== void 0 && clearTimeout(y), x = 0, h = w = d = y = void 0;
    }
    function L() {
      return y === void 0 ? m : B(e());
    }
    function q() {
      var j = e(), W = R(j);
      if (h = arguments, d = this, w = j, W) {
        if (y === void 0)
          return E(w);
        if (S)
          return clearTimeout(y), y = setTimeout(z, c), T(w);
      }
      return y === void 0 && (y = setTimeout(z, c)), m;
    }
    return q.cancel = $, q.flush = L, q;
  }
  return sv = l, sv;
}
var uv, ex;
function XF() {
  if (ex) return uv;
  ex = 1;
  var t = VF(), e = Bg(), r = "Expected a function";
  function n(a, o, l) {
    var u = !0, c = !0;
    if (typeof a != "function")
      throw new TypeError(r);
    return e(l) && (u = "leading" in l ? !!l.leading : u, c = "trailing" in l ? !!l.trailing : c), t(a, o, {
      leading: u,
      maxWait: o,
      trailing: c
    });
  }
  return uv = n, uv;
}
var YF = XF();
const tx = /* @__PURE__ */ Lg(YF);
class ZF {
  tableModel;
  tableController;
  isDragging = !1;
  #e = /* @__PURE__ */ je(0);
  get elementHeight() {
    return D(this.#e);
  }
  set elementHeight(e) {
    pe(this.#e, e, !0);
  }
  #t = /* @__PURE__ */ je(0);
  get labelHeight() {
    return D(this.#t);
  }
  set labelHeight(e) {
    pe(this.#t, e, !0);
  }
  #r = /* @__PURE__ */ Me(() => ar.config.verticalScrollbarPillHeight);
  get pillHeight() {
    return D(this.#r);
  }
  set pillHeight(e) {
    pe(this.#r, e);
  }
  #n = /* @__PURE__ */ Me(() => this.elementHeight - this.pillHeight);
  get scrollbarHeight() {
    return D(this.#n);
  }
  set scrollbarHeight(e) {
    pe(this.#n, e);
  }
  #u = /* @__PURE__ */ Me(() => this.tableController.firstVisibleRowOID ? this.tableController.firstVisibleRowOID : this.tableController.offset + 1);
  get displayRow() {
    return D(this.#u);
  }
  set displayRow(e) {
    pe(this.#u, e);
  }
  #i = /* @__PURE__ */ Me(() => (this.displayRow - 1) / (this.tableModel.numRows - 1) * this.scrollbarHeight);
  get pillPosition() {
    return D(this.#i);
  }
  set pillPosition(e) {
    pe(this.#i, e);
  }
  #a = /* @__PURE__ */ Me(() => {
    if (this.pillPosition === null)
      return 0;
    const e = this.pillPosition + this.pillHeight / 2 - this.labelHeight / 2;
    if (e < 0)
      return e;
    const r = this.pillPosition + this.pillHeight / 2 + this.labelHeight / 2;
    return r > this.elementHeight ? r - this.elementHeight : 0;
  });
  get labelOffset() {
    return D(this.#a);
  }
  set labelOffset(e) {
    pe(this.#a, e);
  }
  constructor({ tableModel: e, tableController: r }) {
    this.tableModel = e, this.tableController = r;
  }
  computeOffsetFromPointer = (e) => {
    this.isDragging = !0;
    let r = Math.round(e.offsetY / this.scrollbarHeight * (this.tableModel.numRows - 1));
    return WF(r, 0, this.tableModel.numRows - 1);
  };
  pointerDown = (e) => {
    e.preventDefault(), e.target.setPointerCapture(e.pointerId), this.isDragging = !0;
    const r = this.computeOffsetFromPointer(e);
    this.tableController.isJumping = !0, this.tableController.jumpToOffset(r);
  };
  handlePointerDown = tx(this.pointerDown, 50);
  pointerMove = (e) => {
    if (this.isDragging) {
      const r = this.computeOffsetFromPointer(e);
      this.tableController.jumpToOffset(r);
    }
  };
  handlePointerMove = tx(this.pointerMove, 50);
  handlePointerUp = (e) => {
    e.target.releasePointerCapture(e.pointerId), this.isDragging = !1, this.tableController.isJumping = !1;
  };
}
class KF {
  #e = /* @__PURE__ */ je(null);
  get columnInfo() {
    return D(this.#e);
  }
  set columnInfo(e) {
    pe(this.#e, e, !0);
  }
  #t = /* @__PURE__ */ Me(() => this.columnInfo ? Object.keys(this.columnInfo).reduce(
    (e, r) => (e[r] = this.columnInfo[r].type, e),
    {}
  ) : {});
  get dataType() {
    return D(this.#t);
  }
  set dataType(e) {
    pe(this.#t, e);
  }
  #r = /* @__PURE__ */ Me(() => this.columnInfo ? Object.keys(this.columnInfo).reduce(
    (e, r) => (e[r] = this.columnInfo[r].sqlType, e),
    {}
  ) : {});
  get sqlType() {
    return D(this.#r);
  }
  set sqlType(e) {
    pe(this.#r, e);
  }
}
class JF {
  tableController;
  #e = /* @__PURE__ */ Me(() => Math.floor(-this.tableController.yScroll / ar.config.scrollOverflowValue) * ar.config.scrollOverflowValue);
  get offset() {
    return D(this.#e);
  }
  set offset(e) {
    pe(this.#e, e);
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
const rx = Symbol("schema"), nx = Symbol("model"), ix = Symbol("controller"), ax = Symbol("vertical-scrollbar-controller"), ox = Symbol("horizontal-scrollbar-controller"), lx = Symbol("table-portal-controller"), sx = Symbol("overscroll-modifier");
let nr = class {
  static initialize() {
    const e = new KF(), r = new RF(e), n = new FF(r, e), a = new ZF({ tableModel: r, tableController: n }), o = new EF({ tableModel: r, tableController: n }), l = new zF(n), u = new JF(n);
    pi(rx, e), pi(nx, r), pi(ix, n), pi(ax, a), pi(ox, o), pi(lx, l), pi(sx, u);
  }
  static get schema() {
    return Nn(rx);
  }
  static get model() {
    return Nn(nx);
  }
  static get controller() {
    return Nn(ix);
  }
  static get verticalScrollbarController() {
    return Nn(ax);
  }
  static get horizontalScrollbarController() {
    return Nn(ox);
  }
  static get tablePortalController() {
    return Nn(lx);
  }
  static get overscrollModifier() {
    return Nn(sx);
  }
};
var QF = /* @__PURE__ */ Gt('<div class="horizontal-scrollbar svelte-1poinb5"><div class="pill svelte-1poinb5"></div></div>');
const eP = {
  hash: "svelte-1poinb5",
  code: ".horizontal-scrollbar.svelte-1poinb5 {position:absolute;bottom:0;left:0;width:100%;height:var(--height);transition:opacity 200ms linear;background-color:var(--scrollbar-bg);}.horizontal-scrollbar.svelte-1poinb5:hover {opacity:1 !important;}.pill.svelte-1poinb5 {width:var(--width);height:calc(var(--height) - var(--margin) * 2);margin:var(--margin);border-radius:2px;background-color:var(--scrollbar-pill-bg);}"
};
function tP(t, e) {
  Fr(e, !0), Er(t, eP);
  const r = nr.horizontalScrollbarController, n = nr.controller, a = ar.config;
  let o = /* @__PURE__ */ je(0), l = /* @__PURE__ */ je(null), u = /* @__PURE__ */ je(null), c = 0;
  Zs(() => (c = requestAnimationFrame(d), () => {
    cancelAnimationFrame(c);
  }));
  function f() {
    D(l) && (D(l).style.opacity = "0");
  }
  const h = hk.debounce(f, 1e3);
  wr(() => {
    D(l) && (n.xScroll, D(l).style.opacity = "1", h());
  });
  function d() {
    pe(o, r.pillWidth, !0), D(u) && (D(u).style.transform = `translate(${r.pillLeft}px, 0)`), c = requestAnimationFrame(d);
  }
  var g = QF();
  let m;
  var y = Yt(g);
  y.__pointerdown = function(...x) {
    r.handlePointerDown?.apply(this, x);
  }, y.__pointermove = function(...x) {
    r.handlePointerMove?.apply(this, x);
  }, y.__pointerup = function(...x) {
    r.handlePointerUp?.apply(this, x);
  };
  let w;
  An(y, (x) => pe(u, x), () => D(u)), Ht(g), An(g, (x) => pe(l, x), () => D(l)), Br(
    (x, _) => {
      m = qn(g, "", m, x), w = qn(y, "", w, _);
    },
    [
      () => ({ "--height": a.horizontalScrollbarHeight + "px" }),
      () => ({
        "--width": D(o) + "px",
        "--margin": r.margin + "px"
      })
    ]
  ), Hi(g, "clientWidth", (x) => r.elementWidth = x), Ct(t, g), Pr();
}
Va(["pointerdown", "pointermove", "pointerup"]);
var rP = /* @__PURE__ */ Gt('<div class="vertical-scrollbar svelte-15rl9bf"><div class="pill svelte-15rl9bf"><div class="label svelte-15rl9bf"> </div></div></div>');
const nP = {
  hash: "svelte-15rl9bf",
  code: ".vertical-scrollbar.svelte-15rl9bf {position:absolute;right:0;top:0;width:var(--width);height:calc(100% - var(--offset-bottom));contain:layout;cursor:row-resize;transition:opacity 200ms linear;user-select:none;background-color:var(--scrollbar-bg);}.vertical-scrollbar.svelte-15rl9bf:hover {opacity:1 !important;}.pill.svelte-15rl9bf {--pill-height: 4px;position:relative;pointer-events:none; /* let the container respond to pointer events */top:0;left:0;width:calc(var(--width) - 2px);margin-left:1px;margin-right:1px;height:var(--pill-height);border-radius:2px;will-change:transform;background-color:var(--scrollbar-pill-bg);}.label.svelte-15rl9bf {--offset: 0;position:absolute;pointer-events:none;top:0;left:-4px;font-family:var(--font-family);font-size:14px;white-space:nowrap;padding:2px 4px;box-shadow:var(--shadow);transform:translate(-100%, calc(-50% + var(--pill-height) / 2 - var(--offset)));border-radius:2px;color:var(--secondary-text-color);background-color:var(--scrollbar-label-bg);border:var(--outline);}"
};
function iP(t, e) {
  Fr(e, !0), Er(t, nP);
  const r = nr.verticalScrollbarController, n = nr.controller, a = ar.config;
  let o = /* @__PURE__ */ je(0), l = /* @__PURE__ */ je(0), u = /* @__PURE__ */ je(null), c = /* @__PURE__ */ je(null), f = /* @__PURE__ */ je(null), h = /* @__PURE__ */ Me(() => new Intl.NumberFormat().format(D(l))), d = 0;
  Zs(() => (d = requestAnimationFrame(y), () => {
    cancelAnimationFrame(d);
  }));
  function g() {
    D(u) && (D(u).style.opacity = "0");
  }
  const m = hk.debounce(g, 1e3);
  wr(() => {
    D(u) && (n.yScroll, D(u).style.opacity = "1", m());
  });
  function y() {
    pe(o, r.pillPosition ?? D(o), !0), pe(l, r.displayRow ?? D(l), !0), D(c) && (D(c).style.transform = `translate3d(0, ${D(o)}px, 0)`), D(f) && D(f).style.setProperty("--offset", r.labelOffset - 1 + "px"), d = requestAnimationFrame(y);
  }
  var w = rP();
  w.__pointerdown = function(...E) {
    r.handlePointerDown?.apply(this, E);
  }, w.__pointermove = function(...E) {
    r.handlePointerMove?.apply(this, E);
  }, w.__pointerup = function(...E) {
    r.handlePointerUp?.apply(this, E);
  };
  let x;
  var _ = Yt(w);
  let S;
  var k = Yt(_), T = Yt(k, !0);
  Ht(k), An(k, (E) => pe(f, E), () => D(f)), Ht(_), An(_, (E) => pe(c, E), () => D(c)), Ht(w), An(w, (E) => pe(u, E), () => D(u)), Br(
    (E, M) => {
      x = qn(w, "", x, E), S = qn(_, "", S, M), ga(T, D(h));
    },
    [
      () => ({
        "--offset-bottom": a.horizontalScrollbarHeight + "px",
        "--width": a.verticalScrollbarWidth + "px"
      }),
      () => ({
        "--pill-height": r.pillHeight + "px"
      })
    ]
  ), Hi(k, "clientHeight", (E) => r.labelHeight = E), Hi(w, "clientHeight", (E) => r.elementHeight = E), Ct(t, w), Pr();
}
Va(["pointerdown", "pointermove", "pointerup"]);
var aP = /* @__PURE__ */ Gt('<a target="_blank"> </a>'), oP = /* @__PURE__ */ Gt('<div class="link-content"><!></div>');
const lP = { hash: "svelte-3kpd", code: "" };
function sP(t, e) {
  Fr(e, !0), Er(t, lP);
  let r = Mc(e, "height");
  var n = oP(), a = Yt(n);
  {
    var o = (l) => {
      var u = aP(), c = Yt(u, !0);
      Ht(u), Br(() => {
        yd(u, "href", e.url), ga(c, e.url);
      }), Ct(l, u);
    };
    Yn(a, (l) => {
      e.url && l(o);
    });
  }
  Ht(n), Hi(n, "clientHeight", r), Ct(t, n), Pr();
}
var uP = /* @__PURE__ */ Gt('<div class="number-content svelte-rqpfez"> </div>');
const cP = {
  hash: "svelte-rqpfez",
  code: ".number-content.svelte-rqpfez {text-align:right;text-overflow:ellipsis;white-space:nowrap;overflow:hidden;}"
};
function fP(t, e) {
  Fr(e, !0), Er(t, cP);
  let r = Mc(e, "height");
  function n(l) {
    return l === null ? null : Number.isInteger(l) ? l.toString() : l.toPrecision(4).toString();
  }
  var a = uP(), o = Yt(a, !0);
  Ht(a), Br((l) => ga(o, l), [() => n(e.number)]), Hi(a, "clientHeight", r), Ct(t, a), Pr();
}
var dP = /* @__PURE__ */ Gt("<div> </div>");
const hP = {
  hash: "svelte-122k9kr",
  code: ".clamped.svelte-122k9kr {display:-webkit-box;-webkit-box-orient:vertical;line-clamp:var(--lines, var(--num-lines)); /* fallback to numlines from parent */-webkit-line-clamp:var(--lines, var(--num-lines));overflow:hidden;text-overflow:ellipsis;}"
};
function ux(t, e) {
  Fr(e, !0), Er(t, hP);
  let r = Mc(e, "height");
  const n = ar.config;
  let a = /* @__PURE__ */ je(null), o = /* @__PURE__ */ je(null);
  wr(() => {
    D(a) && (r(D(a).scrollHeight), pe(o, Math.floor(e.parentHeight / n.lineHeight), !0));
  });
  var l = dP();
  let u;
  var c = Yt(l, !0);
  Ht(l), An(l, (f) => pe(a, f), () => D(a)), Br(
    (f) => {
      Mo(l, 1, `text-content ${(e.clamped ? "clamped" : null) ?? ""}`, "svelte-122k9kr"), u = qn(l, "", u, f), ga(c, e.text);
    },
    [() => ({ "--lines": D(o) })]
  ), Ct(t, l), Pr();
}
class vP {
  #e = /* @__PURE__ */ je(an({}));
  get config() {
    return D(this.#e);
  }
  set config(e) {
    pe(this.#e, e, !0);
  }
}
const cv = "custom-cells";
class Hf {
  static initialize() {
    pi(cv, new vP());
  }
  static set config(e) {
    const r = Nn(cv);
    r.config = e;
  }
  static get config() {
    return Nn(cv).config;
  }
}
var pP = /* @__PURE__ */ Gt('<div class="bigint-content svelte-35i9ld"> </div>');
const gP = {
  hash: "svelte-35i9ld",
  code: ".bigint-content.svelte-35i9ld {text-align:right;text-overflow:ellipsis;white-space:nowrap;overflow:hidden;}"
};
function mP(t, e) {
  Fr(e, !0), Er(t, gP);
  let r = Mc(e, "height");
  function n(l) {
    return l === null ? null : l.toLocaleString();
  }
  var a = pP(), o = Yt(a, !0);
  Ht(a), Br((l) => ga(o, l), [() => n(e.bigint)]), Hi(a, "clientHeight", r), Ct(t, a), Pr();
}
var yP = /* @__PURE__ */ Gt("<div></div>");
const bP = { hash: "svelte-3kpd", code: "" };
function xP(t, e) {
  Fr(e, !0), Er(t, bP);
  let r = Mc(e, "height");
  const n = nr.model, a = (f) => typeof f == "function" ? (h, d) => {
    let g = new f(h, d);
    return {
      ...g.update ? { update: g.update.bind(g) } : {},
      ...g.destroy ? { destroy: g.destroy.bind(g) } : {}
    };
  } : (h, d) => {
    let g = new f.class(h, d);
    return {
      ...g.update ? { update: g.update.bind(g) } : {},
      ...g.destroy ? { destroy: g.destroy.bind(g) } : {}
    };
  };
  let o = /* @__PURE__ */ Me(() => a(e.customCell)), l = /* @__PURE__ */ Me(() => n.getContent({ row: e.row, col: e.col })), u = /* @__PURE__ */ Me(() => n.getRowData(e.row));
  var c = yP();
  Dg(c, (f, h) => D(o)?.(f, h), () => ({ value: D(l), rowData: D(u) })), Ec(() => Hi(c, "clientHeight", r)), Ct(t, c), Pr();
}
var wP = (t, e, r, n, a) => {
  e.addHeightToRow(r.row, D(n) - D(a));
}, _P = /* @__PURE__ */ Gt("<button>↘</button>"), kP = /* @__PURE__ */ Gt('<div class="cell-content clamp svelte-ix87lc"><!> <!></div>');
const SP = {
  hash: "svelte-ix87lc",
  code: ".cell-content.svelte-ix87lc {position:relative;flex-grow:1;line-height:var(--lineHeight);overflow-wrap:anywhere;overflow:hidden;}.expand-button.svelte-ix87lc {all:unset;visibility:hidden;position:absolute;bottom:0;right:0;cursor:pointer;font-size:12px;line-height:18px;padding-left:4px;padding-right:4px;border-radius:2px;color:var(--secondary-text-color);background-color:var(--background-color);border:var(--outline);}.expand-button.show.svelte-ix87lc {visibility:visible;}"
};
function CP(t, e) {
  Fr(e, !0), Er(t, SP);
  const r = nr.model, n = nr.controller, a = nr.schema, o = ar.config, l = Hf.config;
  let u = /* @__PURE__ */ je(0), c = /* @__PURE__ */ je(0), f = /* @__PURE__ */ Me(() => D(c) > D(u));
  const h = r.getContent({ row: e.row, col: e.col }), d = a.dataType[e.col] ?? "string", g = a.sqlType[e.col] ?? "TEXT";
  var m = kP();
  let y;
  var w = Yt(m);
  {
    var x = (T) => {
      xP(T, {
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
          return D(c);
        },
        set height(E) {
          pe(c, E, !0);
        }
      });
    }, _ = (T) => {
      var E = ys(), M = mi(E);
      {
        var R = (B) => {
          var $ = ys(), L = mi($);
          {
            var q = (W) => {
              sP(W, {
                get url() {
                  return h;
                },
                get height() {
                  return D(c);
                },
                set height(Y) {
                  pe(c, Y, !0);
                }
              });
            }, j = (W) => {
              ux(W, {
                get text() {
                  return h;
                },
                get clamped() {
                  return D(f);
                },
                get parentHeight() {
                  return D(u);
                },
                get height() {
                  return D(c);
                },
                set height(Y) {
                  pe(c, Y, !0);
                }
              });
            };
            Yn(L, (W) => {
              h && h.startsWith("http") ? W(q) : W(j, !1);
            });
          }
          Ct(B, $);
        }, z = (B) => {
          var $ = ys(), L = mi($);
          {
            var q = (W) => {
              var Y = ys(), G = mi(Y);
              {
                var X = (V) => {
                  {
                    let U = /* @__PURE__ */ Me(() => BigInt(h ?? ""));
                    mP(V, {
                      get bigint() {
                        return D(U);
                      },
                      get height() {
                        return D(c);
                      },
                      set height(Z) {
                        pe(c, Z, !0);
                      }
                    });
                  }
                }, K = (V) => {
                  fP(V, {
                    get number() {
                      return h;
                    },
                    get height() {
                      return D(c);
                    },
                    set height(U) {
                      pe(c, U, !0);
                    }
                  });
                };
                Yn(G, (V) => {
                  g === "BIGINT" ? V(X) : V(K, !1);
                });
              }
              Ct(W, Y);
            }, j = (W) => {
              ux(W, {
                get text() {
                  return h;
                },
                get clamped() {
                  return D(f);
                },
                get parentHeight() {
                  return D(u);
                },
                get height() {
                  return D(c);
                },
                set height(Y) {
                  pe(c, Y, !0);
                }
              });
            };
            Yn(
              L,
              (W) => {
                d === "number" ? W(q) : W(j, !1);
              },
              !0
            );
          }
          Ct(B, $);
        };
        Yn(
          M,
          (B) => {
            d === "string" ? B(R) : B(z, !1);
          },
          !0
        );
      }
      Ct(T, E);
    };
    Yn(w, (T) => {
      l[e.col] ? T(x) : T(_, !1);
    });
  }
  var S = yi(w, 2);
  {
    var k = (T) => {
      var E = _P();
      E.__click = [wP, n, e, c, u], Br(() => Mo(E, 1, `expand-button ${e.hovered ? "show" : "hide"}`, "svelte-ix87lc")), Ct(T, E);
    };
    Yn(S, (T) => {
      D(f) && T(k);
    });
  }
  Ht(m), Br((T) => y = qn(m, "", y, T), [
    () => ({
      "--lineHeight": o.lineHeight + "px",
      "--num-lines": o.textMaxLines
    })
  ]), Hi(m, "clientHeight", (T) => pe(u, T)), Ct(t, m), Pr();
}
Va(["click"]);
var EP = /* @__PURE__ */ Gt('<div class="row-number svelte-er2yqb"> </div>');
const MP = {
  hash: "svelte-er2yqb",
  code: ".row-number.svelte-er2yqb {flex-grow:1;text-align:right;color:var(--secondary-text-color);text-overflow:ellipsis;white-space:nowrap;overflow:hidden;}"
};
function RP(t, e) {
  Fr(e, !0), Er(t, MP);
  const r = nr.model.getContent({ row: e.row, col: e.col }), n = /* @__PURE__ */ Me(() => new Intl.NumberFormat().format(r ?? 0));
  var a = EP(), o = Yt(a, !0);
  Ht(a), Br(() => ga(o, D(n))), Ct(t, a), Pr();
}
var TP = (t, e) => {
  t.key === "Enter" && e();
}, NP = /* @__PURE__ */ Gt('<div class="cell svelte-1e1vbvn"><!></div>');
const FP = {
  hash: "svelte-1e1vbvn",
  code: ".cell.svelte-1e1vbvn {--x: 0px;--y: 0px;--width: 0px;--height: 0px;display:flex;box-sizing:border-box;padding-top:calc(var(--padding-y) / 2);padding-bottom:calc(var(--padding-y) / 2);padding-right:calc(calc(var(--padding-x) / 2) + var(--extra-right-padding));padding-left:calc(calc(var(--padding-x) / 2) + var(--extra-left-padding));position:absolute;left:0;top:0;width:var(--width);height:var(--height);transform:translate(var(--x), var(--y));contain:layout paint;color:var(--primary-text-color);font-family:var(--cell-font-family);font-size:var(--cell-font-size);}"
};
function PP(t, e) {
  Fr(e, !0), Er(t, FP);
  const r = nr.model, n = nr.controller, a = nr.overscrollModifier, o = ar.config;
  let l = /* @__PURE__ */ Me(() => r.getPosition({ row: e.row, col: e.col })), u = /* @__PURE__ */ Me(() => D(l).x), c = /* @__PURE__ */ Me(() => D(l).y), f = /* @__PURE__ */ Me(() => a.y(D(c))), h = /* @__PURE__ */ Me(() => r.getDimensions({ row: e.row, col: e.col })), d = /* @__PURE__ */ Me(() => D(h).width), g = /* @__PURE__ */ Me(() => D(h).height), m = /* @__PURE__ */ Me(() => r.isFirstCol(e.col)), y = /* @__PURE__ */ Me(() => r.isLastCol(e.col)), w = /* @__PURE__ */ Me(() => r.getRowParity(e.row) === "even" ? "var(--primary-bg)" : "var(--secondary-bg)"), x = () => {
    o.onRowClick && o.onRowClick(e.row);
  }, _ = /* @__PURE__ */ je(!1);
  var S = NP();
  S.__click = x, S.__keydown = [TP, x];
  let k;
  var T = Yt(S);
  {
    var E = (R) => {
      CP(R, {
        get row() {
          return e.row;
        },
        get col() {
          return e.col;
        },
        get hovered() {
          return D(_);
        }
      });
    }, M = (R) => {
      RP(R, {
        get row() {
          return e.row;
        },
        get col() {
          return e.col;
        }
      });
    };
    Yn(T, (R) => {
      e.col !== Rn ? R(E) : R(M, !1);
    });
  }
  Ht(S), Br((R) => k = qn(S, "", k, R), [
    () => ({
      "--x": D(u) + "px",
      "--y": D(f) + "px",
      "--width": D(d) + "px",
      "--height": D(g) + "px",
      "--padding-x": o.betweenColPadding + "px",
      "--padding-y": o.betweenRowPadding + "px",
      "--extra-right-padding": (D(y) ? o.verticalScrollbarWidth : 0) + "px",
      "--extra-left-padding": (D(m) ? o.firstColLeftPadding : 0) + "px",
      "--background-color": D(w)
    })
  ]), sc("pointerenter", S, () => {
    pe(_, !0), n.hoveredRowId = e.row;
  }), sc("pointerleave", S, () => {
    pe(_, !1), n.hoveredRowId = null;
  }), Ct(t, S), Pr();
}
Va(["click", "keydown"]);
var zP = /* @__PURE__ */ Gt('<div class="header-title svelte-1wng68q"> </div>');
const DP = {
  hash: "svelte-1wng68q",
  code: ".header-title.svelte-1wng68q {flex-shrink:1;margin-right:2px;}"
};
function OP(t, e) {
  Fr(e, !0), Er(t, DP);
  const r = ar.config;
  var n = zP(), a = Yt(n, !0);
  Ht(n), Br(() => ga(a, r.columnConfigs[e.col]?.title ?? e.col)), Ct(t, n), Pr();
}
bN();
var LP = /* @__PURE__ */ Gt('<div class="row-number-header svelte-1cjtpqh">#</div>');
const BP = {
  hash: "svelte-1cjtpqh",
  code: ".row-number-header.svelte-1cjtpqh {flex-grow:1;text-align:right;margin-right:4px;box-sizing:border-box;color:var(--secondary-text-color);}"
};
function AP(t) {
  Er(t, BP);
  var e = LP();
  Ct(t, e);
}
var qP = (t, e, r, n, a) => {
  const o = D(e) ? D(r) === "ascending" ? "descending" : null : "ascending";
  o ? n.handleSort({ column: a.col, direction: o }) : n.handleSort(null);
}, jP = /* @__PURE__ */ Gt('<button class="sort-buttons svelte-3f09kb"><div> </div></button>');
const $P = {
  hash: "svelte-3f09kb",
  code: ".sort-buttons.svelte-3f09kb {all:unset;flex-shrink:0;width:16px;cursor:pointer;display:flex;justify-content:center;flex-direction:row;margin-left:4px;border-radius:2px;padding-left:4px;padding-right:4px;color:var(--tertiary-text-color);}.sort-buttons.svelte-3f09kb:hover {--placeholder: 0;background-color:var(--hover-bg);}.sort-glyph.svelte-3f09kb {color:var(--tertiary-text-color);}.sort-buttons.svelte-3f09kb:hover .sort-glyph:where(.svelte-3f09kb) {color:var(--tertiary-text-color);}.selected.svelte-3f09kb {color:var(--primary-text-color) !important;}"
};
function UP(t, e) {
  Fr(e, !0), Er(t, $P);
  const r = nr.controller;
  let n = /* @__PURE__ */ Me(() => r.sort ? r.sort.column === e.col : !1), a = /* @__PURE__ */ Me(() => r.sort ? r.sort.direction : null), o = /* @__PURE__ */ Me(() => D(n) ? D(a) === "ascending" ? "↑" : "↓" : "⇅");
  var l = jP();
  l.__click = [qP, n, a, r, e];
  var u = Yt(l), c = Yt(u, !0);
  Ht(u), Ht(l), Br(() => {
    Mo(u, 1, `sort-button ${(D(n) ? "selected" : null) ?? ""} sort-glyph`, "svelte-3f09kb"), ga(c, D(o));
  }), Ct(t, l), Pr();
}
Va(["click"]);
class IP {
  #e = /* @__PURE__ */ je(an({}));
  get config() {
    return D(this.#e);
  }
  set config(e) {
    pe(this.#e, e, !0);
  }
}
const fv = "custom-cells";
class np {
  static initialize() {
    pi(fv, new IP());
  }
  static set config(e) {
    const r = Nn(fv);
    r.config = e;
  }
  static get config() {
    return Nn(fv).config;
  }
}
var HP = /* @__PURE__ */ Gt("<div></div>");
const WP = { hash: "svelte-3kpd", code: "" };
function GP(t, e) {
  Fr(e, !0), Er(t, WP), nr.model;
  const r = (o) => typeof o == "function" ? (l, u) => {
    let c = new o(l, u);
    return {
      ...c.update ? { update: c.update.bind(c) } : {},
      ...c.destroy ? { destroy: c.destroy.bind(c) } : {}
    };
  } : (l, u) => {
    let c = new o.class(l, u);
    return {
      ...c.update ? { update: c.update.bind(c) } : {},
      ...c.destroy ? { destroy: c.destroy.bind(c) } : {}
    };
  };
  let n = /* @__PURE__ */ Me(() => r(e.customHeader));
  var a = HP();
  Dg(a, (o, l) => D(n)?.(o, l), () => ({ column: e.col })), Ct(t, a), Pr();
}
var VP = /* @__PURE__ */ Gt("<!> <!>", 1), XP = /* @__PURE__ */ Gt('<div><div class="header-content svelte-12avjxu"><!> <div class="header-title svelte-12avjxu"><!></div></div></div>');
const YP = {
  hash: "svelte-12avjxu",
  code: ".header-cell.svelte-12avjxu {position:relative;display:flex;flex-direction:row;align-items:end;width:var(--width);min-height:var(--height);flex-shrink:0;box-sizing:border-box;padding:0.25em;padding-right:calc(calc(var(--padding-x) / 2) + var(--extra-padding-right));padding-left:calc(calc(var(--padding-x) / 2) + var(--extra-padding-left));color:var(--secondary-text-color);font-family:var(--header-font-family);font-size:var(--header-font-size);}.header-cell.number.svelte-12avjxu {justify-content:end;}.header-content.svelte-12avjxu {display:flex;flex-direction:column;flex-shrink:0;}.header-title.svelte-12avjxu {height:1.5em;align-items:center;display:flex;flex-direction:row;flex-shrink:0;}"
};
function ZP(t, e) {
  Fr(e, !0), Er(t, YP);
  const r = nr.model, n = nr.schema, a = ar.config, o = np.config;
  let l = /* @__PURE__ */ je(null), u = /* @__PURE__ */ je(0);
  wr(() => {
    a.minColumnWidths[e.col] = D(u) + a.betweenColPadding;
  });
  const c = /* @__PURE__ */ Me(() => r.colWidths[e.col]), f = /* @__PURE__ */ Me(() => (n.dataType[e.col] ?? "string") === "number"), h = /* @__PURE__ */ Me(() => D(f) || e.col === Rn ? "number" : ""), d = /* @__PURE__ */ Me(() => r.isFirstCol(e.col)), g = /* @__PURE__ */ Me(() => r.isLastCol(e.col));
  let m = /* @__PURE__ */ Me(() => a.headerHeight ? a.headerHeight + "px" : "auto");
  var y = XP();
  let w;
  var x = Yt(y), _ = Yt(x);
  {
    var S = (R) => {
      GP(R, {
        get col() {
          return e.col;
        },
        get customHeader() {
          return o[e.col];
        }
      });
    };
    Yn(_, (R) => {
      o[e.col] && R(S);
    });
  }
  var k = yi(_, 2), T = Yt(k);
  {
    var E = (R) => {
      var z = VP(), B = mi(z);
      OP(B, {
        get col() {
          return e.col;
        }
      });
      var $ = yi(B, 2);
      UP($, {
        get col() {
          return e.col;
        }
      }), Ct(R, z);
    }, M = (R) => {
      AP(R);
    };
    Yn(T, (R) => {
      e.col !== Rn ? R(E) : R(M, !1);
    });
  }
  Ht(k), Ht(x), Ht(y), An(y, (R) => pe(l, R), () => D(l)), Br(
    (R) => {
      Mo(y, 1, `header-cell ${D(h) ?? ""}`, "svelte-12avjxu"), w = qn(y, "", w, R);
    },
    [
      () => ({
        "--width": D(c) + "px",
        "--height": D(m),
        "--padding-x": a.betweenColPadding + "px",
        "--extra-padding-right": (D(g) ? a.verticalScrollbarWidth : 0) + "px",
        "--extra-padding-left": (D(d) ? a.firstColLeftPadding : 0) + "px"
      })
    ]
  ), Hi(x, "clientWidth", (R) => pe(u, R)), Ct(t, y), Pr();
}
class KP {
  tableModel;
  tableController;
  col;
  config;
  isDragging = !1;
  startDragX = 0;
  constructor({ tableModel: e, tableController: r, col: n }) {
    this.tableModel = e, this.tableController = r, this.col = n, this.config = ar.config;
  }
  handlePointerDown = (e) => {
    e.preventDefault(), e.target.setPointerCapture(e.pointerId), this.isDragging = !0, this.startDragX = e.offsetX;
  };
  handlePointerMove = (e) => {
    if (this.isDragging && this.startDragX !== null) {
      const r = e.offsetX - this.startDragX, n = this.tableModel.colWidths[this.col], a = Math.max(0, Math.round(n + r));
      this.config.columnConfigs[this.col] || (this.config.columnConfigs[this.col] = {}), this.config.columnConfigs[this.col].width = a, this.config.onColumnConfigsChange(this.col, N_(this.config.columnConfigs));
    }
  };
  handlePointerUp = (e) => {
    e.target.releasePointerCapture(e.pointerId), this.isDragging = !1, this.startDragX = null;
  };
}
var JP = /* @__PURE__ */ Gt('<div class="header-resize-indicator svelte-1v734te"><div class="pill svelte-1v734te"></div></div>');
const QP = {
  hash: "svelte-1v734te",
  code: ".header-resize-indicator.svelte-1v734te {position:absolute;z-index:2;box-sizing:border-box;width:12px;height:calc(100% - 0.25rem);margin:2px;cursor:col-resize;justify-content:center;display:flex;align-items:center;justify-content:center;transform:translateX(calc(var(--x) - 4px - 50%));}.pill.svelte-1v734te {width:2px;height:calc(100% - 4px);margin-top:2px;margin-bottom:2px;background-color:var(--secondary-text-color);opacity:0.2;border-radius:2px;}"
};
function ez(t, e) {
  Fr(e, !0), Er(t, QP);
  const r = nr.model;
  let n = new KP({
    tableModel: r,
    tableController: nr.controller,
    col: e.col
  });
  const a = /* @__PURE__ */ Me(() => r.colPositions[e.col] + r.colWidths[e.col]);
  var o = JP();
  o.__pointerdown = function(...u) {
    n.handlePointerDown?.apply(this, u);
  }, o.__pointermove = function(...u) {
    n.handlePointerMove?.apply(this, u);
  }, o.__pointerup = function(...u) {
    n.handlePointerUp?.apply(this, u);
  };
  let l;
  Br((u) => l = qn(o, "", l, u), [() => ({ "--x": D(a) + "px" })]), Ct(t, o), Pr();
}
Va(["pointerdown", "pointermove", "pointerup"]);
var tz = (t) => {
  t.stopPropagation();
}, rz = /* @__PURE__ */ Gt('<div class="table-portal svelte-1qnjihj" tabindex="-1"><!></div>');
const nz = {
  hash: "svelte-1qnjihj",
  code: ".table-portal.svelte-1qnjihj {position:absolute;}"
};
function iz(t, e) {
  Fr(e, !0), Er(t, nz);
  const r = nr.controller, n = nr.tablePortalController;
  let a = /* @__PURE__ */ je(null);
  const o = (h) => {
    wr(() => (n.mount(h, e.relativeTo, e.anchor, e.horizontalAlign, e.verticalAlign), h.focus(), () => {
      n.destroy(h);
    }));
  };
  let l = 0;
  Zs(() => {
    l = r.xScroll, requestAnimationFrame(u);
  });
  function u() {
    D(a) && e.stickyX && (D(a).style.transform = `translateX(${r.xScroll - l}px)`), requestAnimationFrame(u);
  }
  var c = rz();
  c.__click = [tz];
  var f = Yt(c);
  zg(f, () => e.children), Ht(c), An(c, (h) => pe(a, h), () => D(a)), Dg(c, (h) => o?.(h)), sc(
    "wheel",
    c,
    // dont let clicks bubble up
    (h) => {
      h.stopPropagation();
    }
  ), Ct(t, c), Pr();
}
Va(["click"]);
var az = (t, e) => {
  pe(e, !0);
}, oz = /* @__PURE__ */ Gt("<button> </button> <!>", 1);
const lz = {
  hash: "svelte-8ns8fr",
  code: '.dropdown.svelte-8ns8fr {all:unset;padding-left:8px;padding-right:8px;border-radius:2px;cursor:pointer;color:var(--secondary-text-color);position:relative;user-select:none;}.dropdown.svelte-8ns8fr::before {content:"";position:absolute;top:0;left:0;height:100%;width:100%;background-color:var(--primary-bg);z-index:-1;}.dropdown.svelte-8ns8fr:hover {background-color:var(--hover-bg);}.unclickable.svelte-8ns8fr {pointer-events:none;}'
};
function sz(t, e) {
  Er(t, lz);
  let r = /* @__PURE__ */ je(!1), n = /* @__PURE__ */ je(null), a = /* @__PURE__ */ je(null);
  var o = oz();
  sc("click", Yv, (h) => {
    D(r) && h.target !== D(n) && pe(r, !1);
  });
  var l = mi(o);
  l.__click = [az, r];
  var u = Yt(l, !0);
  Ht(l), An(l, (h) => pe(n, h), () => D(n));
  var c = yi(l, 2);
  {
    var f = (h) => {
      iz(h, {
        get relativeTo() {
          return e.relativeTo;
        },
        anchor: "outside",
        horizontalAlign: "left",
        verticalAlign: "top",
        stickyX: !1,
        get element() {
          return D(a);
        },
        set element(d) {
          pe(a, d, !0);
        },
        children: (d, g) => {
          var m = ys(), y = mi(m);
          zg(y, () => e.children), Ct(d, m);
        },
        $$slots: { default: !0 }
      });
    };
    Yn(c, (h) => {
      D(r) && h(f);
    });
  }
  Br(() => {
    Mo(l, 1, `dropdown ${D(r) ? "unclickable" : "clickable"}`, "svelte-8ns8fr"), ga(u, e.label);
  }), Ct(t, o);
}
Va(["click"]);
var uz = (t, e, r) => {
  t.target.checked ? e.showColumn(D(r)) : e.hideColumn(D(r));
}, cz = /* @__PURE__ */ Gt('<li class="column-entry svelte-def7zm"><label class="column-label svelte-def7zm"> <input type="checkbox"/></label></li>'), fz = /* @__PURE__ */ Gt('<ul class="column-toggle svelte-def7zm"></ul>'), dz = /* @__PURE__ */ Gt("<!> <!>", 1), hz = /* @__PURE__ */ Gt('<div class="header-row svelte-def7zm"><div class="scroll-container svelte-def7zm"><div class="dropdown-label-container svelte-def7zm"><div class="dropdown-label svelte-def7zm"><!></div></div> <!></div></div>');
const vz = {
  hash: "svelte-def7zm",
  code: ".header-row.svelte-def7zm {flex-shrink:0;border-bottom:1px solid var(--secondary-bg);background-color:var(--primary-bg);}.scroll-container.svelte-def7zm {display:flex;flex-direction:row;}.dropdown-label-container.svelte-def7zm {position:absolute;z-index:20;left:0px;box-sizing:border-box;height:100%;padding:0.25em;display:flex;flex-direction:row;align-items:end;}.dropdown-label.svelte-def7zm {height:1.5em;align-items:center;display:flex;}.column-toggle.svelte-def7zm {margin:0;margin-top:4px;margin-left:8px;padding:12px;background-color:var(--primary-bg);border-radius:4px;box-shadow:var(--shadow);border:var(--outline);max-height:var(--max-height);max-width:var(--max-width);overflow:scroll;}.column-entry.svelte-def7zm {list-style-type:none;padding:4px;user-select:none;}.column-label.svelte-def7zm {display:flex;align-items:center;justify-content:space-between;gap:16px;color:var(--secondary-text-color);}"
};
function pz(t, e) {
  Fr(e, !0), Er(t, vz);
  const r = nr.model, n = nr.controller, a = ar.config;
  let o = /* @__PURE__ */ je(null), l = /* @__PURE__ */ je(null), u = /* @__PURE__ */ je(null), c = /* @__PURE__ */ Me(() => r.renderableCols), f = 0;
  Zs(() => (f = requestAnimationFrame(h), () => {
    cancelAnimationFrame(f);
  }));
  function h() {
    D(l) && (D(l).style.transform = `translate3d(${n.xScroll}px, 0, 0)`), D(u) && (D(u).style.transform = `translate3d(${-n.xScroll}px, 0, 0)`), f = requestAnimationFrame(h);
  }
  var d = hz(), g = Yt(d), m = Yt(g), y = Yt(m), w = Yt(y);
  sz(w, {
    label: "⋮",
    get relativeTo() {
      return D(o);
    },
    children: (_, S) => {
      var k = fz();
      let T;
      ju(k, 21, () => r.columns, uF, (E, M) => {
        var R = cz(), z = Yt(R), B = Yt(z), $ = yi(B);
        mF($), $.__change = [uz, n, M], qn($, "", {}, { float: "right" }), Ht(z), Ht(R), Br(() => {
          ga(B, `${(D(M) === Rn ? "row #" : a.columnConfigs[D(M)]?.title ?? D(M)) ?? ""} `), yd($, "id", `${D(M) ?? ""}-checkbox`), yF($, D(M) === Rn ? a.showRowNumber !== !1 : !a.columnConfigs[D(M)]?.hidden);
        }), Ct(E, R);
      }), Ht(k), Br((E) => T = qn(k, "", T, E), [
        () => ({
          "--max-height": n.viewHeight - 48 + "px",
          "--max-width": n.viewWidth - 48 + "px"
        })
      ]), Ct(_, k);
    }
  }), Ht(y), An(y, (_) => pe(u, _), () => D(u)), Ht(m);
  var x = yi(m, 2);
  ju(x, 16, () => D(c), (_) => _, (_, S) => {
    var k = dz(), T = mi(k);
    ZP(T, {
      get col() {
        return S;
      }
    });
    var E = yi(T, 2);
    ez(E, {
      get col() {
        return S;
      }
    }), Ct(_, k);
  }), Ht(g), An(g, (_) => pe(l, _), () => D(l)), Ht(d), An(d, (_) => pe(o, _), () => D(o)), Ct(t, d), Pr();
}
Va(["change"]);
function gz(t, e) {
  return { ...t, ...t[e] != null ? t[e] : {} };
}
class mz {
  #e = /* @__PURE__ */ je(null);
  get colorScheme() {
    return D(this.#e);
  }
  set colorScheme(e) {
    pe(this.#e, e, !0);
  }
  #t = /* @__PURE__ */ je(an({}));
  get theme() {
    return D(this.#t);
  }
  set theme(e) {
    pe(this.#t, e, !0);
  }
}
const cx = Symbol("style");
class ip {
  static initialize() {
    pi(cx, new mz());
  }
  static get style() {
    return Nn(cx);
  }
}
var yz = /* @__PURE__ */ Gt("<div><!></div>");
const bz = {
  hash: "svelte-vahitw",
  code: ".table-defaults.light.svelte-vahitw {--default-primary-text-color: black;--default-secondary-text-color: gray;--default-tertiary-text-color: lightgray;--default-font-family: sans-serif;--default-font-size: 1rem;--default-primary-bg: white;--default-secondary-bg: rgb(246, 246, 247);--default-tertiary-bg: rgb(234, 234, 235);--default-hover-bg: rgba(0, 0, 0, 0.05);--default-scrollbar-bg: rgba(0, 0, 0, 0.05);--default-scrollbar-pill-bg: rgba(0, 0, 0, 0.5);--default-scrollbar-label-bg: rgba(255, 255, 255, 0.9);--default-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);--default-outline-color: rgb(0 0 0 / 0.2);--default-dimmed-row-color: rgb(0 0 0 / 0.2);--default-row-scroll-to-color: rgb(202 225 255);--default-row-hover-color: rgb(220, 235, 255);}.table-defaults.dark.svelte-vahitw {--default-primary-text-color: lightgray;--default-secondary-text-color: gray;--default-tertiary-text-color: dimgray;--default-font-family: sans-serif;--default-font-size: 1rem;--default-primary-bg: #060607;--default-secondary-bg: #161617;--default-hover-bg: rgba(255, 255, 255, 0.05);--default-scrollbar-bg: rgba(255, 255, 255, 0.05);--default-scrollbar-pill-bg: rgba(255, 255, 255, 0.5);--default-scrollbar-label-bg: rgba(0, 0, 0, 0.9);--default-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);--default-outline-color: rgb(255 255 255 / 0.2);--default-dimmed-row-color: rgb(0 0 0 / 0.6);--default-row-scroll-to-color: rgb(1, 24, 106);--default-row-hover-color: rgb(0, 6, 35);}.style-wrapper.svelte-vahitw {width:100%;height:100%;--primary-text-color: var(--user-primary-text-color, var(--default-primary-text-color));--secondary-text-color: var(--user-secondary-text-color, var(--default-secondary-text-color));--tertiary-text-color: var(--user-tertiary-text-color, var(--default-tertiary-text-color));--font-family: var(--user-font-family, var(--default-font-family));--font-size: var(--user-font-size, var(--default-font-size));--primary-bg: var(--user-primary-bg, var(--default-primary-bg));--secondary-bg: var(--user-secondary-bg, var(--default-secondary-bg));--tertiary-bg: var(--user-tertiarty-bg, var(--default-tertiary-bg));--hover-bg: var(--user-hover-bg, var(--default-hover-bg));--header-font-family: var(--user-header-font-family, var(--font-family));--header-font-size: var(--user-header-font-size, var(--font-size));--cell-font-family: var(--user-cell-font-family, var(--font-family));--cell-font-size: var(--user-cell-font-size, var(--font-size));--scrollbar-bg: var(--user-scrollbar-bg, var(--default-scrollbar-bg));--scrollbar-pill-bg: var(--user-scrollbar-pill-bg, var(--default-scrollbar-pill-bg));--scrollbar-label-bg: var(--user-scrollbar-label-bg, var(--default-scrollbar-label-bg));--shadow: var(--user-shadow, var(--default-shadow));--outline-color: var(--user-outline-color, var(--default-outline-color));--outline: 0.5px solid var(--outline-color);--dimmed-row-color: var(--user-dimmed-row-color, var(--default-dimmed-row-color));--row-scroll-to-color: var(--user-row-scroll-to-color, var(--default-row-scroll-to-color));--row-hover-color: var(--user-row-hover-color, var(--default-row-hover-color));}"
};
function xz(t, e) {
  Fr(e, !0), Er(t, bz);
  const r = ip.style;
  let n = /* @__PURE__ */ Me(() => r.colorScheme), a = /* @__PURE__ */ Me(() => r.theme), o = /* @__PURE__ */ je(null), l = /* @__PURE__ */ Me(() => D(n) ?? D(o) ?? "light");
  const u = (X) => {
    X.matches ? pe(o, "dark") : pe(o, "light");
  }, c = "(prefers-color-scheme: dark";
  Zs(() => (pe(o, window.matchMedia(c).matches ? "dark" : "light", !0), window.matchMedia(c).addEventListener("change", u), () => {
    window.matchMedia(c).removeEventListener("change", u);
  }));
  let f = /* @__PURE__ */ Me(() => gz(D(a), D(l))), h = /* @__PURE__ */ Me(() => D(f).primaryTextColor), d = /* @__PURE__ */ Me(() => D(f).secondaryTextColor), g = /* @__PURE__ */ Me(() => D(f).tertiaryTextColor), m = /* @__PURE__ */ Me(() => D(f).fontFamily), y = /* @__PURE__ */ Me(() => D(f).fontSize), w = /* @__PURE__ */ Me(() => D(f).primaryBackgroundColor), x = /* @__PURE__ */ Me(() => D(f).secondaryBackgroundColor), _ = /* @__PURE__ */ Me(() => D(f).hoverBackgroundColor), S = /* @__PURE__ */ Me(() => D(f).headerFontFamily), k = /* @__PURE__ */ Me(() => D(f).headerFontSize), T = /* @__PURE__ */ Me(() => D(f).cellFontFamily), E = /* @__PURE__ */ Me(() => D(f).cellFontSize), M = /* @__PURE__ */ Me(() => D(f).scrollbarBackgroundColor), R = /* @__PURE__ */ Me(() => D(f).scrollbarPillColor), z = /* @__PURE__ */ Me(() => D(f).scrollbarLabelBackgroundColor), B = /* @__PURE__ */ Me(() => D(f).shadow), $ = /* @__PURE__ */ Me(() => D(f).outlineColor), L = /* @__PURE__ */ Me(() => D(f).dimmedRowColor), q = /* @__PURE__ */ Me(() => D(f).rowScrollToColor), j = /* @__PURE__ */ Me(() => D(f).rowHoverColor);
  wr(() => {
  });
  var W = yz();
  let Y;
  var G = Yt(W);
  zg(G, () => e.children), Ht(W), Br(
    (X) => {
      Mo(W, 1, `style-wrapper table-defaults ${D(l) ?? ""}`, "svelte-vahitw"), Y = qn(W, "", Y, X);
    },
    [
      () => ({
        "--user-primary-text-color": D(h),
        "--user-secondary-text-color": D(d),
        "--user-tertiary-text-color": D(g),
        "--user-font-family": D(m),
        "--user-font-size": D(y),
        "--user-primary-bg": D(w),
        "--user-secondary-bg": D(x),
        "--user-hover-bg": D(_),
        "--user-header-font-family": D(S),
        "--user-header-font-size": D(k),
        "--user-cell-font-family": D(T),
        "--user-cell-font-size": D(E),
        "--user-scrollbar-bg": D(M),
        "--user-scrollbar-pill-bg": D(R),
        "--user-scrollbar-label-bg": D(z),
        "--user-shadow": D(B),
        "--user-outline-color": D($),
        "--user-dimmed-row-color": D(L),
        "--user-row-scroll-to-color": D(q),
        "--user-row-hover-color": D(j)
      })
    ]
  ), Ct(t, W), Pr();
}
function wz() {
  return Rn;
}
function _z(t, e) {
  const r = new Set(t), n = new Set(e);
  return {
    left: t.filter((a) => !n.has(a)),
    right: e.filter((a) => !r.has(a))
  };
}
function kz(t, e) {
  const r = new Set(e);
  return t.filter((n) => !r.has(n));
}
function Sz(t, e) {
  return t.concat(e);
}
var Cz = /* @__PURE__ */ Gt("<div></div>"), Ez = /* @__PURE__ */ Gt("<div></div> <!>", 1);
const Mz = {
  hash: "svelte-h8fig9",
  code: ".row-background.svelte-h8fig9 {position:absolute;width:var(--width);height:var(--height);box-sizing:border-box;z-index:-1;transform:translate3d(0, var(--y), 0);transition:background-color 100ms linear;}.odd.svelte-h8fig9 {background-color:var(--secondary-bg);}.even.svelte-h8fig9 {background-color:var(--primary-bg);}.dimmer.svelte-h8fig9 {background-color:var(--dimmed-row-color);z-index:10;pointer-events:none;}.flashed.svelte-h8fig9 {background-color:var(--row-scroll-to-color);}.hovered.svelte-h8fig9 {background-color:var(--row-hover-color);}"
};
function Rz(t, e) {
  Fr(e, !0), Er(t, Mz);
  const r = nr.controller, n = nr.model, a = nr.overscrollModifier, o = ar.config;
  let l = /* @__PURE__ */ Me(() => n.rowHeights[e.row]), u = /* @__PURE__ */ Me(() => Math.max(n.colsRightmostPosition, r.viewWidth)), c = /* @__PURE__ */ Me(() => a.y(n.rowPositions[e.row])), f = /* @__PURE__ */ Me(() => n.getRowParity(e.row)), h = /* @__PURE__ */ Me(() => r.flashedRowId === e.row), d = /* @__PURE__ */ Me(() => r.hoveredRowId === e.row), g = /* @__PURE__ */ Me(() => o.highlightedRows ? o.highlightedRows?.has(e.row) : null);
  var m = Ez(), y = mi(m);
  let w;
  var x = yi(y, 2);
  {
    var _ = (S) => {
      var k = Cz();
      let T;
      Br(
        (E) => {
          Mo(k, 1, `row-background ${D(f) ?? ""} dimmer`, "svelte-h8fig9"), T = qn(k, "", T, E);
        },
        [
          () => ({
            "--width": D(u) + "px",
            "--height": D(l) + "px",
            "--y": D(c) + "px"
          })
        ]
      ), Ct(S, k);
    };
    Yn(x, (S) => {
      D(g) !== null && !D(g) && S(_);
    });
  }
  Br(
    (S) => {
      Mo(y, 1, `row-background ${D(f) ?? ""} ${(D(h) ? "flashed" : null) ?? ""} ${(D(d) && o.highlightHoveredRow ? "hovered" : null) ?? ""}`, "svelte-h8fig9"), w = qn(y, "", w, S);
    },
    [
      () => ({
        "--width": D(u) + "px",
        "--height": D(l) + "px",
        "--y": D(c) + "px"
      })
    ]
  ), Ct(t, m), Pr();
}
var Tz = /* @__PURE__ */ Gt("<!> <!>", 1), Nz = /* @__PURE__ */ Gt('<div class="scroll-container svelte-1q3xqdh"><!></div> <!> <!>', 1), Fz = /* @__PURE__ */ Gt('<div class="table svelte-1q3xqdh"><!> <div class="table-contents svelte-1q3xqdh"><!></div></div>');
const Pz = {
  hash: "svelte-1q3xqdh",
  code: ".table.svelte-1q3xqdh {width:100%;max-width:var(--max-width);height:100%;display:flex;flex-direction:column;position:relative;}.table-contents.svelte-1q3xqdh {position:relative;overflow:hidden;flex-grow:1;}.scroll-container.svelte-1q3xqdh {position:absolute;width:0;height:0;will-change:transform;contain:layout size;}"
};
function zz(t, e) {
  Fr(e, !0), Er(t, Pz), ar.initialize(), Hf.initialize(), ip.initialize(), nr.initialize();
  const r = nr.controller, n = nr.model, a = nr.overscrollModifier, o = ar.config, l = ip.style;
  wr(() => {
    e.scrollTo != null && r.scrollToRow(String(e.scrollTo));
  }), wr(() => {
    e.highlightedRows && e.highlightedRows.length > 0 ? o.highlightedRows = new Set(e.highlightedRows.map((S) => String(S))) : o.highlightedRows = null;
  }), wr(() => {
    e.onRowClick != null ? o.onRowClick = e.onRowClick : o.onRowClick = null;
  }), wr(() => {
    e.coordinator ? rp.coordinator = e.coordinator : rp.coordinator = null;
  }), wr(() => {
    e.numLines != null ? o.textMaxLines = e.numLines : o.textMaxLines = o.DEFAULT_TEXT_MAX_LINES, e.lineHeight != null ? o.lineHeight = e.lineHeight : o.lineHeight = o.DEFAULT_LINE_HEIGHT;
  }), wr(() => {
    e.colorScheme != null ? l.colorScheme = e.colorScheme : l.colorScheme = null;
  }), wr(() => {
    e.theme != null ? l.theme = e.theme : l.theme = {}, e.colorScheme != null ? l.colorScheme = e.colorScheme : l.colorScheme = null;
  }), wr(() => {
    e.columnConfigs != null ? o.columnConfigs = e.columnConfigs : o.columnConfigs = {}, e.onColumnConfigsChange != null ? o.onColumnConfigsChange = e.onColumnConfigsChange : o.onColumnConfigsChange = () => {
    };
  }), wr(() => {
    o.showRowNumber = e.showRowNumber ?? null;
  }), wr(() => {
    o.onShowRowNumberChange = e.onShowRowNumberChange ?? null;
  }), wr(() => {
    r.initialize({
      tableName: e.table,
      rowKey: e.rowKey,
      columns: [wz(), ...e.columns],
      filterBy: e.filter ?? null
    });
  }), wr(() => {
    e.customCells != null ? Hf.config = e.customCells : Hf.config = {};
  }), wr(() => {
    e.additionalHeaderContents != null ? np.config = e.additionalHeaderContents : np.config = {};
  }), wr(() => {
    e.headerHeight != null ? o.headerHeight = e.headerHeight : o.headerHeight = null;
  }), wr(() => {
    e.highlightHoveredRow != null ? o.highlightHoveredRow = e.highlightHoveredRow : o.highlightHoveredRow = !1;
  });
  let u = /* @__PURE__ */ je([]), c = /* @__PURE__ */ je(0), f = /* @__PURE__ */ je(null), h = /* @__PURE__ */ je(an([])), d = /* @__PURE__ */ je(an([])), g = /* @__PURE__ */ Me(() => D(h).filter((S) => r.rowStillExists(S))), m = /* @__PURE__ */ Me(() => D(d)), y = 0;
  Zs(() => (y = requestAnimationFrame(_), () => {
    r.teardown(), n.teardown(), cancelAnimationFrame(y);
  }));
  function w(S, k) {
    if (k.length > 0) {
      const T = k[k.length - 1];
      return Math.abs(n.data[S][Tn] - n.data[T][Tn]);
    }
    return 0;
  }
  function x() {
    const { left: S, right: k } = _z(D(u), n.renderableRows);
    S.length === 0 && k.length === 0 || (pe(u, kz(D(
      u
      // remove the rows that have been deleted from the model
    ), S)), pe(u, Sz(D(
      u
      // add the rows that have been added by the model
    ), k.sort((T, E) => w(T, D(u)) - w(E, D(u))).slice(0, r.isJumping ? r.rowsOnScreen : o.rowRenderBatchSize))));
  }
  function _() {
    x(), pe(h, D(u).filter((T) => r.rowIsVisible(T)), !0), pe(d, n.renderableCols.filter((T) => r.colIsVisible(T)), !0);
    const S = r.xScroll, k = a.yScroll(r.yScroll);
    D(f) && (D(f).style.transform = `translate3d(${S}px, ${k}px, 0)`), pe(c, r.updateKey, !0), y = requestAnimationFrame(_);
  }
  xz(t, {
    children: (S, k) => {
      var T = Fz(), E = Yt(T);
      pz(E, {});
      var M = yi(E, 2), R = Yt(M);
      {
        var z = (B) => {
          var $ = Nz(), L = mi($), q = Yt(L);
          sF(q, () => D(c), (Y) => {
            var G = Tz(), X = mi(G);
            ju(X, 16, () => D(g), (V) => V, (V, U) => {
              var Z = ys(), le = mi(Z);
              ju(le, 16, () => D(m), (se) => se, (se, ye) => {
                PP(se, {
                  get row() {
                    return U;
                  },
                  get col() {
                    return ye;
                  }
                });
              }), Ct(V, Z);
            });
            var K = yi(X, 2);
            ju(K, 16, () => n.renderableRows, (V) => V, (V, U) => {
              Rz(V, {
                get row() {
                  return U;
                }
              });
            }), Ct(Y, G);
          }), Ht(L), An(L, (Y) => pe(f, Y), () => D(f));
          var j = yi(L, 2);
          iP(j, {});
          var W = yi(j, 2);
          tP(W, {}), Ct(B, $);
        };
        Yn(R, (B) => {
          r.isReady && B(z);
        });
      }
      Ht(M), Ht(T), An(T, (B) => r.element = B, () => r?.element), sc("wheel", T, function(...B) {
        r.handleWheel?.apply(this, B);
      }), Hi(M, "clientHeight", (B) => r.viewHeight = B), Hi(M, "clientWidth", (B) => r.viewWidth = B), Ct(S, T);
    },
    $$slots: { default: !0 }
  }), Pr();
}
class Dz {
  component;
  currentProps;
  constructor(e, r) {
    this.currentProps = { ...r }, this.component = iF({ component: zz, target: e, props: r });
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
var Oz = /* @__PURE__ */ _e("<div></div>");
function Lz(t, e) {
  mt(e, !0);
  let r = /* @__PURE__ */ bn(e, ["$$slots", "$$events", "$$legacy"]), n;
  bc(() => {
    let o = new Dz(n, r);
    yn(() => {
      o.update(r);
    }), Xw(() => {
      o.destroy();
    });
  });
  var a = Oz();
  nt(a, "", {}, { width: "100%", height: "100%" }), Ii(a, (o) => n = o, () => n), te(t, a), yt();
}
var Bz = /* @__PURE__ */ _e("<div></div>");
function Az(t, e) {
  mt(e, !0);
  let r = /* @__PURE__ */ bn(e, ["$$slots", "$$events", "$$legacy"]), n;
  bc(() => {
    let o = new ZT(n, r);
    yn(() => {
      o.update(r);
    }), Xw(() => {
      o.destroy();
    });
  });
  var a = Bz();
  nt(a, "", {}, { display: "flex" }), Ii(a, (o) => n = o, () => n), te(t, a), yt();
}
var qz = (t, e, r) => {
  e(v(r), t);
}, jz = /* @__PURE__ */ _e('<tr><td class="first:rounded-tl-md first:rounded-bl-md"><div class="block w-4 h-4 mx-2 rounded-full"></div></td><td><div class="whitespace-nowrap nowrap max-w-72 text-ellipsis overflow-hidden"> </div></td><td class="text-slate-400 px-2 text-xs text-right last:rounded-tr-md last:rounded-br-md" title="Count"> </td></tr>'), $z = /* @__PURE__ */ _e('<div class="absolute right-0 top-0 p-2 m-2 rounded-md bg-opacity-90 bg-slate-100 dark:bg-slate-800"><table><tbody></tbody></table></div>');
function Uz(t, e) {
  mt(e, !0);
  let r = tt(e, "selection", 3, null), n = /* @__PURE__ */ me(/* @__PURE__ */ new Set());
  const a = {
    reset: () => {
      H(n, /* @__PURE__ */ new Set());
    }
  };
  function o(f, h) {
    if (h.shiftKey || h.metaKey) {
      let d = new Set(v(n));
      d.has(f) ? d.delete(f) : d.add(f), H(n, d);
    } else
      v(n).has(f) && v(n).size == 1 ? H(n, /* @__PURE__ */ new Set()) : H(n, /* @__PURE__ */ new Set([f]));
  }
  et(() => {
    let f = r();
    if (f != null)
      return et(() => {
        let h = v(n), d = h.size != 0 ? Array.from(h).map((m) => m.predicate.toString()).join(" OR ") : null, g = {
          source: a,
          clients: (/* @__PURE__ */ new Set()).add(a),
          value: h.size == 0 ? null : h,
          predicate: d
        };
        f.activate(g), f.update(g);
      }), () => {
        f.update({
          source: a,
          clients: (/* @__PURE__ */ new Set()).add(a),
          value: null,
          predicate: null
        });
      };
  }), et(() => {
    let f = e.stateStore;
    if (!f)
      return;
    let h = f.subscribe((d) => {
      d != null && H(n, new Set(e.items.filter((g) => d.selectedItems.indexOf(g.label) >= 0)));
    });
    return et(() => {
      f.set({
        selectedItems: Array.from(v(n)).map((d) => d.label)
      });
    }), h;
  });
  var l = $z(), u = ne(l), c = ne(u);
  Xt(c, 21, () => e.items, or, (f, h) => {
    var d = jz();
    const g = /* @__PURE__ */ ie(() => v(n).has(v(h)) || v(n).size == 0);
    let m;
    d.__click = [qz, o, h];
    var y = ne(d), w = ne(y);
    let x;
    ee(y);
    var _ = oe(y), S = ne(_), k = ne(S, !0);
    ee(S), ee(_);
    var T = oe(_), E = ne(T, !0);
    ee(T), ee(d), Ne(
      (M, R, z) => {
        m = Sr(d, 1, "hover:bg-slate-200 dark:hover:bg-slate-700 select-none leading-7", null, m, M), x = nt(w, "", x, R), Q(S, "title", v(h).label), it(k, v(h).label), it(E, z);
      },
      [
        () => ({ "opacity-20": !v(g) }),
        () => ({ "background-color": v(h).color }),
        () => v(h).count.toLocaleString()
      ]
    ), te(f, d);
  }), ee(c), ee(u), ee(l), te(t, l), yt();
}
Nr(["click"]);
const fx = Symbol("coordinator"), dx = Symbol("darkMode");
class yr {
  static get coordinator() {
    return Ry(fx) ?? Nd();
  }
  static set coordinator(e) {
    Ty(fx, e);
  }
  static get darkMode() {
    return Ry(dx);
  }
  static set darkMode(e) {
    Ty(dx, e);
  }
}
function Ef(t, e, r) {
  return t + (e - t) * r;
}
function Iz(t, e, r) {
  let n = Math.log(t.scale), a = Math.log(e.scale);
  if (Math.abs(a - n) < 1e-5)
    return {
      x: Ef(t.x, e.x, r),
      y: Ef(t.y, e.y, r),
      scale: Ef(t.scale, e.scale, r)
    };
  let o = Math.exp(Ef(n, a, r));
  return {
    x: (e.x * e.scale - t.x * t.scale + (t.x - e.x) * (t.scale * e.scale / o)) / (e.scale - t.scale),
    y: (e.y * e.scale - t.y * t.scale + (t.y - e.y) * (t.scale * e.scale / o)) / (e.scale - t.scale),
    scale: o
  };
}
var Hz = /* @__PURE__ */ _e('<div class="absolute left-0 right-0 top-0 bottom-0"><!> <!></div>');
function Wz(t, e) {
  mt(e, !0);
  const [r, n] = Ei(), a = () => On(c, "$darkMode", r), o = 800;
  let l = tt(e, "onClickPoint", 3, null);
  const u = yr.coordinator, c = yr.darkMode;
  let f = /* @__PURE__ */ me(null), h = /* @__PURE__ */ me(null), d = /* @__PURE__ */ me(null), g = /* @__PURE__ */ me([]), m = /* @__PURE__ */ me(750), y = /* @__PURE__ */ me(750), w = /* @__PURE__ */ ie(() => e.stateStore?.child("legend")), x;
  function _($) {
    H(d, null);
    let L = v(f);
    if (L == null) {
      H(f, $);
      return;
    }
    let q = o, j = (/* @__PURE__ */ new Date()).getTime(), W = () => {
      let Y = ((/* @__PURE__ */ new Date()).getTime() - j) / q;
      Y > 1 ? Y = 1 : x = requestAnimationFrame(W), H(f, Iz(L, $, Up(Y)));
    };
    x && cancelAnimationFrame(x), x = requestAnimationFrame(W);
  }
  function S($) {
    H(g, [$]), H(d, $);
  }
  function k() {
    x && cancelAnimationFrame(x);
  }
  function T($) {
    l()?.($);
  }
  yn(() => {
    v(g)?.[0] != null && T(v(g)?.[0]);
  }), et(() => {
    let $ = e.stateStore;
    if (!$)
      return;
    let L = $.subscribe((q) => {
      q != null && (H(f, q.viewportState), H(h, q.rangeSelection));
    });
    return yn(() => {
      $.set({
        viewportState: v(f),
        rangeSelection: v(h)
      });
    }), L;
  });
  var E = Hz(), M = ne(E);
  {
    let $ = /* @__PURE__ */ ie(() => a() ? "dark" : "light"), L = /* @__PURE__ */ ie(() => e.categoryLegend?.indexColumn), q = /* @__PURE__ */ ie(() => e.categoryLegend?.legend.map((W) => W.color)), j = /* @__PURE__ */ ie(() => 1 / 16 * Math.exp(-(e.minimumDensityExpFactor ?? 0)));
    Az(M, {
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
        return v($);
      },
      get text() {
        return e.text;
      },
      get category() {
        return v(L);
      },
      get categoryColors() {
        return v(q);
      },
      get minimumDensity() {
        return v(j);
      },
      get additionalFields() {
        return e.additionalFields;
      },
      get viewportState() {
        return v(f);
      },
      onViewportState: (W) => {
        H(f, W), k();
      },
      get tooltip() {
        return v(d);
      },
      onTooltip: (W) => H(d, W),
      get selection() {
        return v(g);
      },
      onSelection: (W) => {
        H(g, W);
      },
      get filter() {
        return e.filter;
      },
      get rangeSelection() {
        return e.filter;
      },
      get rangeSelectionValue() {
        return v(h);
      },
      onRangeSelection: (W) => {
        H(h, W);
      },
      get automaticLabels() {
        return e.automaticLabels;
      },
      get width() {
        return v(m);
      },
      get height() {
        return v(y);
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
  var R = oe(M, 2);
  {
    var z = ($) => {
      var L = dr(), q = Ie(L);
      Id(q, () => e.categoryLegend, (j) => {
        Uz(j, {
          get items() {
            return e.categoryLegend.legend;
          },
          get selection() {
            return e.filter;
          },
          get stateStore() {
            return v(w);
          }
        });
      }), te($, L);
    };
    Fe(R, ($) => {
      e.categoryLegend != null && $(z);
    });
  }
  ee(E), bl(E, "clientWidth", ($) => H(m, $)), bl(E, "clientHeight", ($) => H(y, $)), te(t, E);
  var B = yt({ startViewportAnimation: _, showTooltip: S });
  return n(), B;
}
function Gz(t, { from: e, to: r }, n = {}) {
  var { delay: a = 0, duration: o = (M) => Math.sqrt(M) * 120, easing: l = Up } = n, u = getComputedStyle(t), c = u.transform === "none" ? "" : u.transform, [f, h] = u.transformOrigin.split(" ").map(parseFloat);
  f /= t.clientWidth, h /= t.clientHeight;
  var d = Vz(t), g = t.clientWidth / r.width / d, m = t.clientHeight / r.height / d, y = e.left + e.width * f, w = e.top + e.height * h, x = r.left + r.width * f, _ = r.top + r.height * h, S = (y - x) * g, k = (w - _) * m, T = e.width / r.width, E = e.height / r.height;
  return {
    delay: a,
    duration: typeof o == "function" ? o(Math.sqrt(S * S + k * k)) : o,
    easing: l,
    css: (M, R) => {
      var z = R * S, B = R * k, $ = M + R * T, L = M + R * E;
      return `transform: ${c} translate(${z}px, ${B}px) scale(${$}, ${L});`;
    }
  };
}
function Vz(t) {
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
var Xz = (t, e) => {
  e.onClick?.();
}, Yz = /* @__PURE__ */ _e("<span> </span>"), Zz = /* @__PURE__ */ _e("<button><!> <!></button>");
function Oi(t, e) {
  mt(e, !0);
  let r = tt(e, "label", 3, null), n = tt(e, "icon", 3, null), a = tt(e, "title", 3, ""), o = tt(e, "order", 3, null), l = tt(e, "style", 3, "default");
  const u = {
    default: "bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 dark:text-slate-400 focus-visible:outline-2 outline-blue-600 -outline-offset-1",
    plotCell: "bg-white text-slate-400 border-slate-300 hover:text-slate-500 hover:border-slate-500 dark:text-slate-500 dark:border-slate-500 dark:bg-slate-800 dark:hover:border-slate-300 dark:hover:text-slate-300",
    plotCellClose: "bg-white text-red-500 border-red-500 hover:text-white hover:bg-red-500 dark:bg-slate-800"
  };
  var c = Zz();
  c.__click = [Xz, e];
  let f;
  var h = ne(c);
  {
    var d = (y) => {
      var w = dr();
      const x = /* @__PURE__ */ ie(n);
      var _ = Ie(w);
      qp(_, () => v(x), (S, k) => {
        k(S, { class: "w-5 h-5" });
      }), te(y, w);
    };
    Fe(h, (y) => {
      n() != null && y(d);
    });
  }
  var g = oe(h, 2);
  {
    var m = (y) => {
      var w = Yz();
      let x;
      var _ = ne(w, !0);
      ee(w), Ne(
        (S) => {
          x = Sr(w, 1, "", null, x, S), it(_, r());
        },
        [() => ({ "ml-1": n() != null })]
      ), te(y, w);
    };
    Fe(g, (y) => {
      r() != null && r() != "" && y(m);
    });
  }
  ee(c), Ne(
    (y) => {
      Sr(c, 1, `rounded-md px-1.5 py-1.5 h-[28px] flex select-none items-center border ${u[l()] ?? ""} ${e.class ?? "" ?? ""}`), Q(c, "title", a()), f = nt(c, "", f, y);
    },
    [() => ({ order: o() })]
  ), te(t, c), yt();
}
Nr(["click"]);
var Mf = {}, hx = Symbol(), Kz = Symbol(), mk = (t) => typeof t == "string" ? uc[t] : t, uc = {
  plain: Mf,
  plaintext: Mf,
  text: Mf,
  txt: Mf
}, yk = (t, e) => (e[Kz] || Jz)(t, e), Jz = (t, e) => {
  for (var r = [t], n, a = [], o = 0; n = mk(e[hx]); )
    delete e[hx], Object.assign(e, n);
  for (_k(t, e, r, 0); a[o++] = r[0], r = r[1]; ) ;
  return a;
}, bk = (t, e, r) => t.replace(/&/g, "&amp;").replace(e, r), vx = "</span>", Rf = "", Cu = "", xk = (t) => {
  for (var e = "", r = t.length, n = 0; n < r; ) e += wk(t[n++]);
  return e;
}, wk = (t) => {
  if (t instanceof Du) {
    var { type: e, alias: r, content: n } = t, a = Rf, o = Cu, l = `<span class="token ${e + (r ? " " + r : "") + (e == "keyword" && typeof n == "string" ? " keyword-" + n : "")}">`;
    Cu += vx, Rf += l;
    var u = wk(n);
    return Rf = a, Cu = o, l + u + vx;
  }
  return typeof t != "string" ? xk(t) : (t = bk(t, /</g, "&lt;"), Cu && t.includes(`
`) ? t.replace(/\n/g, Cu + `
` + Rf) : t);
}, _k = (t, e, r, n, a) => {
  for (var o in e)
    if (e[o]) for (var l = 0, u = e[o], c = Array.isArray(u) ? u : [u]; l < c.length; ++l) {
      if (a && a[0] == o && a[1] == l)
        return;
      for (var f = c[l], h = f.pattern || f, d = mk(f.inside), g = f.lookbehind, m = f.greedy && h.global, y = f.alias, w = r, x = n; w && (!a || x < a[2]); x += w[0].length, w = w[1]) {
        var _ = w[0], S = 0, k, T;
        if (!(_ instanceof Du)) {
          if (h.lastIndex = m ? x : 0, k = h.exec(m ? t : _), !k && m)
            break;
          if (k && k[0]) {
            if (g && k[1] && (T = k[1].length, k.index += T, k[0] = k[0].slice(T)), m) {
              for (var z = k.index, E = z + k[0].length, M; z >= x + (M = w[0].length); w = w[1], x += M) ;
              if (w[0] instanceof Du)
                continue;
              for (var R = w, u = x; (u += R[0].length) < E; R = R[1], S++) ;
              _ = t.slice(x, u), k.index -= x;
            }
            for (var z = k.index, B = k[0], $ = _.slice(z + B.length), L = x + _.length, q = new Du(o, d ? yk(B, d) : B, B, y), j = w, W = 0, Y; j = j[1], W++ < S; ) ;
            $ && (!j || j[0] instanceof Du ? j = [$, j] : j[0] = $ + j[0]), x += z, w[0] = z ? _.slice(0, z) : q, z ? w = w[1] = [q, j] : w[1] = j, S && (_k(t, e, w, x, Y = [o, l, L]), L = Y[2]), a && L > a[2] && (a[2] = L);
          }
        }
      }
    }
};
function Du(t, e, r, n) {
  this.type = t, this.content = e, this.alias = n, this.length = r.length;
}
const Qz = (t, e, ...r) => {
  let n, a = [], o, l = "", u, c = !1, f = !0, h = [], d, g = 0;
  const m = rD(), y = m.firstChild, w = y.children, x = w[0], _ = x.firstChild, S = { language: "text", value: l }, k = new Set(r), T = {}, E = (Y) => {
    Object.assign(S, Y);
    let G = l != (l = Y.value ?? l), X = n != (n = S.language);
    d = !!S.readOnly, m.style.tabSize = S.tabSize || 2, _.inputMode = d ? "none" : "", _.setAttribute("aria-readonly", d), z(), R(), G && (c || _.remove(), _.value = l, _.selectionEnd = 0, c || x.prepend(_)), (G || X) && M();
  }, M = () => {
    h = yk(l = _.value, uc[n] || {}), q("tokenize", h, n, l);
    let Y = xk(h).split(`
`), G = 0, X = g, K = g = Y.length;
    for (; Y[G] == a[G] && G < K; ) ++G;
    for (; K && Y[--K] == a[--X]; ) ;
    if (G == K && G == X) w[G + 1].innerHTML = Y[G] + `
`;
    else {
      let V = X < G ? X : G - 1, U = V, Z = "";
      for (; U < K; ) Z += `<div class=pce-line aria-hidden=true>${Y[++U]}
</div>`;
      for (U = K < G ? K : G - 1; U < X; U++) w[G + 1].remove();
      for (Z && w[V + 1].insertAdjacentHTML("afterend", Z), U = V + 1; U < g; ) w[++U].setAttribute("data-line", U);
      m.style.setProperty(
        "--number-width",
        (0 | Math.log10(g)) + 1 + ".001ch"
      );
    }
    q("update", l), j(!0), f && setTimeout(setTimeout, 0, () => f = !0), a = Y, f = !1;
  }, R = (Y) => {
    (Y || k).forEach((G) => {
      typeof G == "object" ? (G.update(W, S), Y && k.add(G)) : (G(W, S), Y || k.delete(G));
    });
  }, z = ([Y, G] = B()) => {
    m.className = `prism-code-editor language-${n}${S.lineNumbers == !1 ? "" : " show-line-numbers"} pce-${S.wordWrap ? "" : "no"}wrap${S.rtl ? " pce-rtl" : ""} pce-${Y < G ? "has" : "no"}-selection${c ? " pce-focus" : ""}${d ? " pce-readonly" : ""}${S.class ? " " + S.class : ""}`;
  }, B = () => [
    _.selectionStart,
    _.selectionEnd,
    _.selectionDirection
  ], $ = {
    Escape() {
      _.blur();
    }
  }, L = {}, q = (Y, ...G) => {
    T[Y]?.forEach((X) => X.apply(W, G)), S["on" + Y[0].toUpperCase() + Y.slice(1)]?.apply(W, G);
  }, j = (Y) => {
    if (Y || f) {
      const G = B(), X = w[u = kk(l, 0, G[G[2] < "f" ? 0 : 1])];
      X != o && (o?.classList.remove("active-line"), X.classList.add("active-line"), o = X), z(G), q("selectionChange", G, l);
    }
  }, W = {
    container: m,
    wrapper: y,
    lines: w,
    textarea: _,
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
      return h;
    },
    inputCommandMap: L,
    keyCommandMap: $,
    extensions: {},
    setOptions: E,
    update: M,
    getSelection: B,
    addExtensions(...Y) {
      R(Y);
    },
    on: (Y, G) => ((T[Y] ||= /* @__PURE__ */ new Set()).add(G), () => T[Y].delete(G)),
    remove() {
      m.remove();
    }
  };
  return Ra(_, "keydown", (Y) => {
    $[Y.key]?.(Y, B(), l) && vi(Y);
  }), Ra(_, "beforeinput", (Y) => {
    (d || Y.inputType == "insertText" && L[Y.data]?.(Y, B(), l)) && vi(Y);
  }), Ra(_, "input", M), Ra(_, "blur", () => {
    bd = null, c = !1, z();
  }), Ra(_, "focus", () => {
    bd = j, c = !0, z();
  }), Ra(_, "selectionchange", (Y) => {
    j(), vi(Y);
  }), tD(t)?.append(m), e && E(e), W;
}, ja = "u" > typeof window ? document : null, dv = /* @__PURE__ */ ja?.createElement("div"), eD = (t, e) => (dv && (dv.innerHTML = t, e = dv.firstChild), () => e.cloneNode(!0)), Ra = (t, e, r, n) => t.addEventListener(e, r, n), tD = (t) => typeof t == "string" ? ja.querySelector(t) : t, kk = (t, e = 0, r = 1 / 0) => {
  let n = 1;
  for (; (e = t.indexOf(`
`, e) + 1) && e <= r; n++) ;
  return n;
}, hv = {}, rD = /* @__PURE__ */ eD(
  "<div><div class=pce-wrapper><div class=pce-overlays><textarea class=pce-textarea spellcheck=false autocapitalize=off autocomplete=off>"
), vi = (t) => {
  t.preventDefault(), t.stopImmediatePropagation();
};
let bd;
ja && Ra(ja, "selectionchange", () => bd?.());
const xd = (t, e) => e ? t.lastIndexOf(`
`, e - 1) + 1 : 0, Ag = (t, e) => (e = t.indexOf(`
`, e)) + 1 ? e : t.length, px = (t, e, r, n) => Ra(t.textarea, e, r, n), nD = (t, e) => parseFloat(getComputedStyle(t)[e]);
new Set("xml,rss,atom,jsx,tsx,xquery,xeora,xeoracube,actionscript".split(","));
let Tf;
const Eu = (t) => t.replace(/[$+?|.^*()[\]{}\\]/g, "\\$&"), gx = (t, e) => t.slice(xd(t, e), e), uo = (t, e, r = e) => [
  t.slice(e = xd(t, e), r = Ag(t, r)).split(`
`),
  e,
  r
], iD = (t, e, r = 0, n = r, a = t.getSelection()[0]) => {
  const o = t.value, l = t.lines[kk(o, 0, a)], u = ja.createTreeWalker(l, 5);
  let c = u.lastChild(), f = Ag(o, a) + 1 - a - c.length;
  for (; -f <= n && (c = u.previousNode()); )
    if (!c.lastChild && (f -= c.length || 0, f <= r)) {
      for (; c != l; c = c.parentNode)
        if (c.matches?.(e)) return c;
    }
}, vv = (t, e) => iD(t, "[class*=language-]", 0, 0, e)?.className.match(
  /language-(\S*)/
)[1] || t.options.language, En = (t, e, r, n, a, o) => {
  if (t.options.readOnly) return;
  Tf = t.getSelection(), n ??= r;
  let l = t.textarea, u = t.value, c = op && !u[n ?? Tf[1]] && /\n$/.test(e) && /^$|\n$/.test(u), f;
  t.focused || l.focus(), r != null && l.setSelectionRange(r, n), a != null && (f = t.on("update", () => {
    l.setSelectionRange(
      a,
      o ?? a,
      Tf[2]
    ), f();
  })), pv || l.dispatchEvent(new InputEvent("beforeinput", { data: e })), op || pv ? (c && (l.selectionEnd--, e = e.slice(0, -1)), pv && (e += `
`), ja.execCommand(e ? "insertHTML" : "delete", !1, bk(e, /</g, "&lt;")), c && l.selectionStart++) : ja.execCommand(e ? "insertText" : "delete", !1, e), Tf = 0;
}, aD = (t, e, r = e, n) => {
  let a = t.focused, o = t.textarea, l;
  a || (Ra(
    o,
    "focus",
    (u) => {
      l = u.relatedTarget;
    },
    { once: !0 }
  ), o.focus()), o.setSelectionRange(e, r, n), bd(!(!a && (l ? l.focus() : o.blur())));
}, Sk = ja ? navigator.userAgent : "", ap = ja ? /Mac|iPhone|iPod|iPad/i.test(navigator.platform) : !1, op = /Chrome\//.test(Sk), pv = !op && /AppleWebKit\//.test(Sk), Nf = (t) => t.altKey + t.ctrlKey * 2 + t.metaKey * 4 + t.shiftKey * 8;
let lp = !1;
const Ff = ap ? 4 : 2, oD = (t) => lp = t, Zo = (t) => t.search(/\S|$/), lD = (t = ['""', "''", "``", "()", "[]", "{}"], e = /([^$\w'"`]["'`]|.[[({])[.,:;\])}>\s]|.[[({]`/s) => (r, n) => {
  let a;
  const { keyCommandMap: o, inputCommandMap: l, getSelection: u, container: c } = r, f = navigator.clipboard, h = ({ insertSpaces: x = !0, tabSize: _ } = n) => [x ? " " : "	", x ? _ || 2 : 1], d = () => !n.readOnly && !r.extensions.cursor?.scrollIntoView(), g = ([x, _], [S, k], T, E) => (x < _ || !E && e.test((T[_ - 1] || " ") + S + (T[_] || " "))) && !En(r, S + T.slice(x, _) + k, null, null, x + 1, _ + 1), m = ([x, _], S, k) => x == _ && k[_] == S && !aD(r, x + 1), y = (x, _, S, k, T, E) => {
    let M = _.join(`
`);
    if (M != x.join(`
`)) {
      const R = x.length - 1, z = _[R], B = x[R], $ = B.length - z.length, L = _[0].length - x[0].length, q = S + Zo((L < 0 ? _ : x)[0]), j = k - B.length + Zo($ > 0 ? z : B), W = S - k + M.length + $, Y = q > T ? T : Math.max(q, T + L), G = E + S - k + M.length;
      En(
        r,
        M,
        S,
        k,
        Y,
        E < j ? G + $ : Math.max(j + W, G)
      );
    }
  }, w = (x, _, S, k, T, E, M, R) => {
    y(
      _,
      _.map(
        x ? (z) => z.slice(Zo(z) ? R - Zo(z) % R : 0) : (z) => z && M.repeat(R - Zo(z) % R) + z
      ),
      S,
      k,
      T,
      E
    );
  };
  l["<"] = (x, _, S) => g(_, "<>", S, !0), t.forEach(([x, _]) => {
    const S = x == _;
    l[x] = (k, T, E) => (S && m(T, _, E) || g(T, x + _, E)) && d(), S || (l[_] = (k, T, E) => m(T, _, E) && d());
  }), l[">"] = (x, _, S) => {
    const k = hv[vv(r)]?.autoCloseTags?.(_, S, r);
    k && (En(r, ">" + k, null, null, _[0] + 1), vi(x));
  }, o.Tab = (x, [_, S], k) => {
    if (lp || n.readOnly || Nf(x) & 6) return;
    const [T, E] = h(n), M = x.shiftKey, [R, z, B] = uo(k, _, S);
    return _ < S || M ? w(M, R, z, B, _, S, T, E) : En(r, T.repeat(E - (_ - z) % E)), d();
  }, o.Enter = (x, _, S) => {
    const k = Nf(x) & 7;
    if (!k || k == Ff) {
      k && (_[0] = _[1] = uo(S, _[1])[2]);
      const [T, E] = h(), [M, R] = _, z = hv[vv(r)]?.autoIndent, B = Math.floor(Zo(gx(S, M)) / E) * E, $ = z?.[0]?.(_, S, r) ? E : 0, L = z?.[1]?.(_, S, r), q = `
` + T.repeat(B + $) + (L ? `
` + T.repeat(B) : "");
      if (q[1] || S[R])
        return En(r, q, M, R, M + B + $ + 1), d();
    }
  }, o.Backspace = (x, [_, S], k) => {
    if (_ == S) {
      const T = gx(k, _), E = n.tabSize || 2, M = t.includes(k.slice(_ - 1, _ + 1)), R = /[^ ]/.test(T) ? 0 : (T.length - 1) % E + 1;
      if (M || R > 1)
        return En(r, "", _ - (M ? 1 : R), _ + M), d();
    }
  };
  for (let x = 0; x < 2; x++)
    o[x ? "ArrowDown" : "ArrowUp"] = (_, [S, k], T) => {
      const E = Nf(_);
      if (E == 1) {
        const M = x ? S : xd(T, S) - 1, R = x ? T.indexOf(`
`, k) + 1 : k;
        if (M > -1 && R > 0) {
          const [z, B, $] = uo(T, M, R), L = z[x ? "pop" : "shift"](), q = (L.length + 1) * (x ? 1 : -1);
          z[x ? "unshift" : "push"](L), En(r, z.join(`
`), B, $, S + q, k + q);
        }
        return d();
      } else if (E == 9) {
        const [M, R, z] = uo(T, S, k), B = M.join(`
`), $ = x ? B.length + 1 : 0;
        return En(r, B + `
` + B, R, z, S + $, k + $), d();
      } else if (E == 2 && !ap)
        return c.scrollBy(0, nD(c, "lineHeight") * (x ? 1 : -1)), !0;
    };
  px(r, "keydown", (x) => {
    const _ = Nf(x), S = x.keyCode, [k, T, E] = u();
    if (_ == Ff && (S == 221 || S == 219))
      w(S == 219, ...uo(r.value, k, T), k, T, ...h()), d(), vi(x);
    else if (_ == (ap ? 10 : 2) && S == 77)
      oD(!lp), vi(x);
    else if (S == 191 && _ == Ff || S == 65 && _ == 9) {
      const M = r.value, R = _ == 9, z = R ? k : xd(M, k), B = hv[vv(r, z)] || {}, { line: $, block: L } = B.getComments?.(r, z, M) || B.comments || {}, [q, j, W] = uo(M, k, T), Y = q.length - 1;
      if (R) {
        if (L) {
          const [G, X] = L, K = M.slice(k, T), V = M.slice(0, k).search(Eu(G) + " ?$"), U = RegExp("^ ?" + Eu(X)).test(M.slice(T));
          V + 1 && U ? En(
            r,
            K,
            V,
            T + +(M[T] == " ") + X.length,
            V,
            V + T - k
          ) : En(
            r,
            `${G} ${K} ${X}`,
            k,
            T,
            k + G.length + 1,
            T + G.length + 1
          ), d(), vi(x);
        }
      } else if ($) {
        const G = Eu($), X = RegExp(`^\\s*(${G} ?|$)`), K = RegExp(G + " ?"), V = !/\S/.test(M.slice(j, W)), U = q.map(
          q.every((Z) => X.test(Z)) && !V ? (Z) => Z.replace(K, "") : (Z) => V || /\S/.test(Z) ? Z.replace(/^\s*/, `$&${$} `) : Z
        );
        y(q, U, j, W, k, T), d(), vi(x);
      } else if (L) {
        const [G, X] = L, K = Zo(q[0]), V = q[0].startsWith(G, K) && q[Y].endsWith(X), U = q.slice();
        U[0] = q[0].replace(
          V ? RegExp(Eu(G) + " ?") : /(?=\S)|$/,
          V ? "" : G + " "
        );
        let Z = U[0].length - q[0].length;
        U[Y] = V ? U[Y].replace(RegExp(`( ?${Eu(X)})?$`), "") : U[Y] + " " + X;
        let le = U.join(`
`), se = K + j, ye = se > k ? k : Math.max(k + Z, se), Se = se > T - (k != T) ? T : Math.min(Math.max(se, T + Z), j + le.length);
        En(r, le, j, W, ye, Math.max(ye, Se)), d(), vi(x);
      }
    } else if (_ == 8 + Ff && S == 75) {
      const M = r.value, [R, z, B] = uo(M, k, T), $ = E > "f" ? T - B + R.pop().length : k - z, L = Ag(M, B + 1) - B - 1;
      En(
        r,
        "",
        z - !!z,
        B + !z,
        z + Math.min($, L)
      ), d(), vi(x);
    }
  }), ["copy", "cut", "paste"].forEach(
    (x) => px(r, x, (_) => {
      const [S, k] = u();
      if (S == k && f) {
        const [[T], E, M] = uo(r.value, S, k);
        x == "paste" ? _.clipboardData.getData("text/plain") == a && (En(r, a + `
`, E, E, S + a.length + 1), d(), vi(_)) : (f.writeText(a = T), x == "cut" && (En(r, "", E, M + 1), d()), vi(_));
      }
    })
  );
};
var sD = () => ({
  pattern: /\/\/.*|\/\*[^]*?(?:\*\/|$)/g,
  greedy: !0
}), uD = /\b(?:false|true)\b/;
uc.webmanifest = uc.json = {
  property: {
    pattern: /"(?:\\.|[^\\\n"])*"(?=\s*:)/g,
    greedy: !0
  },
  string: {
    pattern: /"(?:\\.|[^\\\n"])*"/g,
    greedy: !0
  },
  comment: sD(),
  number: /-?\b\d+(?:\.\d+)?(?:e[+-]?\d+)?\b/i,
  operator: /:/,
  punctuation: /[[\]{},]/,
  boolean: uD,
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
var cD = /* @__PURE__ */ _e('<div><div class="w-full h-full grid"></div></div>');
function qg(t, e) {
  mt(e, !0);
  const [r, n] = Ei(), a = () => On(o, "$darkMode", r);
  let o = yr.darkMode, l;
  yn(() => {
    if (l == null)
      return;
    let f = Qz(
      l,
      {
        language: e.language ?? "json",
        value: Gi(() => e.value ?? ""),
        lineNumbers: !1,
        onUpdate(h) {
          e.onChange?.(h);
        }
      },
      lD()
    );
    return yn(() => {
      e.value !== f.value && f.setOptions({ value: e.value ?? "" });
    }), () => {
      f.remove();
    };
  });
  var u = cD(), c = ne(u);
  Ii(c, (f) => l = f, () => l), ee(u), Ne(() => Sr(u, 1, `h-64 rounded-md border border-slate-200 dark:border-slate-600 overflow-hidden ${a() ? "code-editor-dark" : "code-editor-light"} ${e.className ?? "" ?? ""}`)), te(t, u), yt(), n();
}
const fD = "useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict";
let jg = (t = 21) => {
  let e = "", r = crypto.getRandomValues(new Uint8Array(t |= 0));
  for (; t--; )
    e += fD[r[t] & 63];
  return e;
};
function mx(t, e, r, n) {
  !e() || !v(r) || e()(n(v(r).value));
}
var dD = /* @__PURE__ */ _e("<option disabled selected> </option>"), hD = /* @__PURE__ */ _e("<hr/>"), vD = /* @__PURE__ */ _e("<option> </option>"), pD = /* @__PURE__ */ _e('<label class="select-none flex items-center gap-2"><span class="text-slate-500 dark:text-slate-400 whitespace-nowrap"> </span> <select><!><!></select></label>'), gD = /* @__PURE__ */ _e("<option disabled selected> </option>"), mD = /* @__PURE__ */ _e("<hr/>"), yD = /* @__PURE__ */ _e("<option> </option>"), bD = /* @__PURE__ */ _e("<select><!><!></select>");
function Ko(t, e) {
  mt(e, !0);
  let r = tt(e, "label", 3, void 0), n = tt(e, "disabled", 3, !1), a = tt(e, "placeholder", 3, null), o = tt(e, "options", 19, () => []), l = tt(e, "onChange", 3, void 0), u = /* @__PURE__ */ me(void 0);
  const c = jg(), f = c + "_null", h = c + "_undefined", d = (_) => _ === null ? f : _ === void 0 ? h : _.toString(), g = (_) => _ === f ? null : _ === h ? void 0 : _;
  var m = dr(), y = Ie(m);
  {
    var w = (_) => {
      var S = pD(), k = ne(S), T = ne(k, !0);
      ee(k);
      var E = oe(k, 2);
      E.__change = [mx, l, u, g];
      var M = ne(E);
      {
        var R = ($) => {
          var L = dD(), q = ne(L, !0);
          ee(L), L.value = (L.__value = null) ?? "", Ne(() => it(q, a())), te($, L);
        };
        Fe(M, ($) => {
          a() != null && $(R);
        });
      }
      var z = oe(M);
      Xt(z, 17, o, or, ($, L) => {
        var q = dr(), j = Ie(q);
        {
          var W = (G) => {
            var X = hD();
            te(G, X);
          }, Y = (G) => {
            var X = vD(), K = ne(X, !0);
            ee(X);
            var V = {};
            Ne(
              (U) => {
                it(K, v(L).label), V !== (V = U) && (X.value = (X.__value = U) ?? "");
              },
              [() => d(v(L).value)]
            ), te(G, X);
          };
          Fe(j, (G) => {
            v(L) === "---" ? G(W) : G(Y, !1);
          });
        }
        te($, q);
      }), ee(E), Ii(E, ($) => H(u, $), () => v(u));
      var B;
      ed(E), ee(S), Ne(
        ($) => {
          it(T, r()), Sr(E, 1, `form-select rounded-md py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 dark:text-slate-400 text-ellipsis ${e.class ?? "" ?? ""}`), E.disabled = n(), B !== (B = $) && (E.value = (E.__value = $) ?? "", Bs(E, $));
        },
        [() => d(e.value)]
      ), te(_, S);
    }, x = (_) => {
      var S = bD();
      S.__change = [mx, l, u, g];
      var k = ne(S);
      {
        var T = (R) => {
          var z = gD(), B = ne(z, !0);
          ee(z), z.value = (z.__value = null) ?? "", Ne(() => it(B, a())), te(R, z);
        };
        Fe(k, (R) => {
          a() != null && R(T);
        });
      }
      var E = oe(k);
      Xt(E, 17, o, or, (R, z) => {
        var B = dr(), $ = Ie(B);
        {
          var L = (j) => {
            var W = mD();
            te(j, W);
          }, q = (j) => {
            var W = yD(), Y = ne(W, !0);
            ee(W);
            var G = {};
            Ne(
              (X) => {
                it(Y, v(z).label), G !== (G = X) && (W.value = (W.__value = X) ?? "");
              },
              [() => d(v(z).value)]
            ), te(j, W);
          };
          Fe($, (j) => {
            v(z) === "---" ? j(L) : j(q, !1);
          });
        }
        te(R, B);
      }), ee(S), Ii(S, (R) => H(u, R), () => v(u));
      var M;
      ed(S), Ne(
        (R) => {
          Sr(S, 1, `form-select rounded-md py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 dark:text-slate-400 select-none text-ellipsis ${e.class ?? "" ?? ""}`), S.disabled = n(), M !== (M = R) && (S.value = (S.__value = R) ?? "", Bs(S, R));
        },
        [() => d(e.value)]
      ), te(_, S);
    };
    Fe(y, (_) => {
      r() != null ? _(w) : _(x, !1);
    });
  }
  te(t, m), yt();
}
Nr(["change"]);
var Pi = { slate: { 300: "oklch(86.9% 0.022 252.894)", 400: "oklch(70.4% 0.04 256.788)", 500: "oklch(55.4% 0.046 257.417)", 600: "oklch(44.6% 0.043 257.281)" }, gray: { 500: "oklch(55.1% 0.027 264.364)" } };
const xD = `<svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
<line x1="15" y1="54" x2="15" y2="12" stroke="black" stroke-width="2"/>
<line x1="32" y1="53" x2="32" y2="10" stroke="black" stroke-width="2"/>
<line x1="49" y1="45" x2="49" y2="19" stroke="black" stroke-width="2"/>
<rect x="8" y="27" width="14" height="18" rx="3" fill="#007AFF"/>
<rect x="25" y="22" width="14" height="14" rx="3" fill="#007AFF"/>
<rect x="42" y="27" width="14" height="12" rx="3" fill="#007AFF"/>
</svg>
`, wD = `<svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect x="8" y="8" width="48" height="14" rx="3" fill="#007AFF"/>
<rect x="8" y="25" width="36" height="14" rx="3" fill="#007AFF"/>
<rect x="8" y="42" width="24" height="14" rx="3" fill="#007AFF"/>
</svg>
`, _D = `<svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
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
`, kD = `<svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M28.1666 45.7042C28.9268 45.8901 29.611 45.5001 29.8329 44.7506L36.9814 20.6115C37.1728 19.9366 36.8385 19.2589 36.0783 19.0547C35.3333 18.8689 34.6979 19.1477 34.4425 20.0235L27.3365 44.0276C27.1175 44.7804 27.3579 45.5001 28.1666 45.7042Z" fill="black"/>
<path d="M12 32.3568C12 32.7499 12.1764 33.1396 12.5046 33.4216L22.0655 41.9466C22.6825 42.4776 23.4794 42.4744 23.9719 41.9287C24.4765 41.3647 24.3975 40.5639 23.829 40.0662L15.214 32.3568L23.829 24.6476C24.3975 24.1496 24.4765 23.3488 23.9719 22.7851C23.4794 22.2391 22.6825 22.2362 22.0655 22.7669L12.5046 31.2922C12.1764 31.5742 12 31.9639 12 32.3568ZM52.1638 32.3568C52.1638 31.9639 52.0027 31.5742 51.6742 31.2922L42.1015 22.7669C41.481 22.2362 40.6997 22.2391 40.1948 22.7851C39.6871 23.3488 39.7663 24.1496 40.3378 24.6476L48.968 32.3568L40.3378 40.0662C39.7663 40.5639 39.6871 41.3647 40.1948 41.9287C40.6997 42.4744 41.481 42.4776 42.1015 41.9466L51.6742 33.4216C52.0027 33.1396 52.1638 32.7499 52.1638 32.3568Z" fill="black"/>
</svg>
`, SD = `<svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M8 33H22V53C22 54.6569 20.6569 56 19 56H11C9.34315 56 8 54.6569 8 53V33Z" fill="#34C759"/>
<path d="M8 19C8 17.3431 9.34315 16 11 16H19C20.6569 16 22 17.3431 22 19V34H8V19Z" fill="#007AFF"/>
<path d="M25 39H39V53C39 54.6569 37.6569 56 36 56H28C26.3431 56 25 54.6569 25 53V39Z" fill="#34C759"/>
<path d="M42 32H56V53C56 54.6569 54.6569 56 53 56H45C43.3431 56 42 54.6569 42 53V32Z" fill="#34C759"/>
<path d="M25 29C25 27.3431 26.3431 26 28 26H36C37.6569 26 39 27.3431 39 29V40H25V29Z" fill="#3C82F6"/>
<path d="M42 16C42 14.3431 43.3431 13 45 13H53C54.6569 13 56 14.3431 56 16V33H42V16Z" fill="#007AFF"/>
</svg>
`, CD = `<svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect x="8" y="32" width="14" height="24" rx="3" fill="#007AFF"/>
<rect x="25" y="12" width="14" height="44" rx="3" fill="#007AFF"/>
<rect x="42" y="24" width="14" height="32" rx="3" fill="#007AFF"/>
</svg>
`;
var ED = /* @__PURE__ */ _e('<div class="w-12 h-12"><!></div>');
function MD(t, e) {
  mt(e, !0);
  const [r, n] = Ei(), a = () => On(o, "$darkMode", r), o = yr.darkMode, l = {
    "chart-boxplot": xD,
    "chart-h-bar": wD,
    "chart-heatmap": _D,
    "chart-stacked": SD,
    "chart-v-histogram": CD,
    "chart-spec": kD
  };
  function u(h, d) {
    h = h.replace("xmlns", 'style="width:100%;height:100%" xmlns');
    let g = d ? { black: Pi.slate[400] } : { black: Pi.slate[500] };
    for (let m in g)
      h = h.replaceAll(m, g[m]);
    return h;
  }
  var c = ED(), f = ne(c);
  eM(f, () => u(l[e.type] ?? "", a())), ee(c), te(t, c), yt(), n();
}
var RD = /* @__PURE__ */ _e("<div><!></div>");
function oh(t, e) {
  let r = /* @__PURE__ */ me(300), n = /* @__PURE__ */ me(200);
  var a = RD();
  nt(a, "", {}, {
    "user-select": "none",
    position: "relative",
    width: "100%",
    height: "100%"
  });
  var o = ne(a);
  Vu(o, () => e.children ?? Ot, () => v(r), () => v(n)), ee(a), bl(a, "clientWidth", (l) => H(r, l)), bl(a, "clientHeight", (l) => H(n, l)), te(t, a);
}
function TD(t) {
  return Math.abs(t = Math.round(t)) >= 1e21 ? t.toLocaleString("en").replace(/,/g, "") : t.toString(10);
}
function wd(t, e) {
  if ((r = (t = e ? t.toExponential(e - 1) : t.toExponential()).indexOf("e")) < 0) return null;
  var r, n = t.slice(0, r);
  return [
    n.length > 1 ? n[0] + n.slice(2) : n,
    +t.slice(r + 1)
  ];
}
function Us(t) {
  return t = wd(Math.abs(t)), t ? t[1] : NaN;
}
function ND(t, e) {
  return function(r, n) {
    for (var a = r.length, o = [], l = 0, u = t[0], c = 0; a > 0 && u > 0 && (c + u + 1 > n && (u = Math.max(1, n - c)), o.push(r.substring(a -= u, a + u)), !((c += u + 1) > n)); )
      u = t[l = (l + 1) % t.length];
    return o.reverse().join(e);
  };
}
function FD(t) {
  return function(e) {
    return e.replace(/[0-9]/g, function(r) {
      return t[+r];
    });
  };
}
var PD = /^(?:(.)?([<>=^]))?([+\-( ])?([$#])?(0)?(\d+)?(,)?(\.\d+)?(~)?([a-z%])?$/i;
function cc(t) {
  if (!(e = PD.exec(t))) throw new Error("invalid format: " + t);
  var e;
  return new $g({
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
cc.prototype = $g.prototype;
function $g(t) {
  this.fill = t.fill === void 0 ? " " : t.fill + "", this.align = t.align === void 0 ? ">" : t.align + "", this.sign = t.sign === void 0 ? "-" : t.sign + "", this.symbol = t.symbol === void 0 ? "" : t.symbol + "", this.zero = !!t.zero, this.width = t.width === void 0 ? void 0 : +t.width, this.comma = !!t.comma, this.precision = t.precision === void 0 ? void 0 : +t.precision, this.trim = !!t.trim, this.type = t.type === void 0 ? "" : t.type + "";
}
$g.prototype.toString = function() {
  return this.fill + this.align + this.sign + this.symbol + (this.zero ? "0" : "") + (this.width === void 0 ? "" : Math.max(1, this.width | 0)) + (this.comma ? "," : "") + (this.precision === void 0 ? "" : "." + Math.max(0, this.precision | 0)) + (this.trim ? "~" : "") + this.type;
};
function zD(t) {
  e: for (var e = t.length, r = 1, n = -1, a; r < e; ++r)
    switch (t[r]) {
      case ".":
        n = a = r;
        break;
      case "0":
        n === 0 && (n = r), a = r;
        break;
      default:
        if (!+t[r]) break e;
        n > 0 && (n = 0);
        break;
    }
  return n > 0 ? t.slice(0, n) + t.slice(a + 1) : t;
}
var Ck;
function DD(t, e) {
  var r = wd(t, e);
  if (!r) return t + "";
  var n = r[0], a = r[1], o = a - (Ck = Math.max(-8, Math.min(8, Math.floor(a / 3))) * 3) + 1, l = n.length;
  return o === l ? n : o > l ? n + new Array(o - l + 1).join("0") : o > 0 ? n.slice(0, o) + "." + n.slice(o) : "0." + new Array(1 - o).join("0") + wd(t, Math.max(0, e + o - 1))[0];
}
function yx(t, e) {
  var r = wd(t, e);
  if (!r) return t + "";
  var n = r[0], a = r[1];
  return a < 0 ? "0." + new Array(-a).join("0") + n : n.length > a + 1 ? n.slice(0, a + 1) + "." + n.slice(a + 1) : n + new Array(a - n.length + 2).join("0");
}
const bx = {
  "%": (t, e) => (t * 100).toFixed(e),
  b: (t) => Math.round(t).toString(2),
  c: (t) => t + "",
  d: TD,
  e: (t, e) => t.toExponential(e),
  f: (t, e) => t.toFixed(e),
  g: (t, e) => t.toPrecision(e),
  o: (t) => Math.round(t).toString(8),
  p: (t, e) => yx(t * 100, e),
  r: yx,
  s: DD,
  X: (t) => Math.round(t).toString(16).toUpperCase(),
  x: (t) => Math.round(t).toString(16)
};
function xx(t) {
  return t;
}
var wx = Array.prototype.map, _x = ["y", "z", "a", "f", "p", "n", "µ", "m", "", "k", "M", "G", "T", "P", "E", "Z", "Y"];
function OD(t) {
  var e = t.grouping === void 0 || t.thousands === void 0 ? xx : ND(wx.call(t.grouping, Number), t.thousands + ""), r = t.currency === void 0 ? "" : t.currency[0] + "", n = t.currency === void 0 ? "" : t.currency[1] + "", a = t.decimal === void 0 ? "." : t.decimal + "", o = t.numerals === void 0 ? xx : FD(wx.call(t.numerals, String)), l = t.percent === void 0 ? "%" : t.percent + "", u = t.minus === void 0 ? "−" : t.minus + "", c = t.nan === void 0 ? "NaN" : t.nan + "";
  function f(d) {
    d = cc(d);
    var g = d.fill, m = d.align, y = d.sign, w = d.symbol, x = d.zero, _ = d.width, S = d.comma, k = d.precision, T = d.trim, E = d.type;
    E === "n" ? (S = !0, E = "g") : bx[E] || (k === void 0 && (k = 12), T = !0, E = "g"), (x || g === "0" && m === "=") && (x = !0, g = "0", m = "=");
    var M = w === "$" ? r : w === "#" && /[boxX]/.test(E) ? "0" + E.toLowerCase() : "", R = w === "$" ? n : /[%p]/.test(E) ? l : "", z = bx[E], B = /[defgprs%]/.test(E);
    k = k === void 0 ? 6 : /[gprs]/.test(E) ? Math.max(1, Math.min(21, k)) : Math.max(0, Math.min(20, k));
    function $(L) {
      var q = M, j = R, W, Y, G;
      if (E === "c")
        j = z(L) + j, L = "";
      else {
        L = +L;
        var X = L < 0 || 1 / L < 0;
        if (L = isNaN(L) ? c : z(Math.abs(L), k), T && (L = zD(L)), X && +L == 0 && y !== "+" && (X = !1), q = (X ? y === "(" ? y : u : y === "-" || y === "(" ? "" : y) + q, j = (E === "s" ? _x[8 + Ck / 3] : "") + j + (X && y === "(" ? ")" : ""), B) {
          for (W = -1, Y = L.length; ++W < Y; )
            if (G = L.charCodeAt(W), 48 > G || G > 57) {
              j = (G === 46 ? a + L.slice(W + 1) : L.slice(W)) + j, L = L.slice(0, W);
              break;
            }
        }
      }
      S && !x && (L = e(L, 1 / 0));
      var K = q.length + L.length + j.length, V = K < _ ? new Array(_ - K + 1).join(g) : "";
      switch (S && x && (L = e(V + L, V.length ? _ - j.length : 1 / 0), V = ""), m) {
        case "<":
          L = q + L + j + V;
          break;
        case "=":
          L = q + V + L + j;
          break;
        case "^":
          L = V.slice(0, K = V.length >> 1) + q + L + j + V.slice(K);
          break;
        default:
          L = V + q + L + j;
          break;
      }
      return o(L);
    }
    return $.toString = function() {
      return d + "";
    }, $;
  }
  function h(d, g) {
    var m = f((d = cc(d), d.type = "f", d)), y = Math.max(-8, Math.min(8, Math.floor(Us(g) / 3))) * 3, w = Math.pow(10, -y), x = _x[8 + y / 3];
    return function(_) {
      return m(w * _) + x;
    };
  }
  return {
    format: f,
    formatPrefix: h
  };
}
var Pf, Xa, Ek;
LD({
  thousands: ",",
  grouping: [3],
  currency: ["$", ""]
});
function LD(t) {
  return Pf = OD(t), Xa = Pf.format, Ek = Pf.formatPrefix, Pf;
}
function BD(t) {
  return Math.max(0, -Us(Math.abs(t)));
}
function AD(t, e) {
  return Math.max(0, Math.max(-8, Math.min(8, Math.floor(Us(e) / 3))) * 3 - Us(Math.abs(t)));
}
function qD(t, e) {
  return t = Math.abs(t), e = Math.abs(e) - t, Math.max(0, Us(e) - Us(t)) + 1;
}
function Wf(t, e) {
  return t == null || e == null ? NaN : t < e ? -1 : t > e ? 1 : t >= e ? 0 : NaN;
}
function jD(t, e) {
  return t == null || e == null ? NaN : e < t ? -1 : e > t ? 1 : e >= t ? 0 : NaN;
}
function Mk(t) {
  let e, r, n;
  t.length !== 2 ? (e = Wf, r = (u, c) => Wf(t(u), c), n = (u, c) => t(u) - c) : (e = t === Wf || t === jD ? t : $D, r = t, n = t);
  function a(u, c, f = 0, h = u.length) {
    if (f < h) {
      if (e(c, c) !== 0) return h;
      do {
        const d = f + h >>> 1;
        r(u[d], c) < 0 ? f = d + 1 : h = d;
      } while (f < h);
    }
    return f;
  }
  function o(u, c, f = 0, h = u.length) {
    if (f < h) {
      if (e(c, c) !== 0) return h;
      do {
        const d = f + h >>> 1;
        r(u[d], c) <= 0 ? f = d + 1 : h = d;
      } while (f < h);
    }
    return f;
  }
  function l(u, c, f = 0, h = u.length) {
    const d = a(u, c, f, h - 1);
    return d > f && n(u[d - 1], c) > -n(u[d], c) ? d - 1 : d;
  }
  return { left: a, center: l, right: o };
}
function $D() {
  return 0;
}
function UD(t) {
  return t === null ? NaN : +t;
}
const ID = Mk(Wf), HD = ID.right;
Mk(UD).center;
class kx extends Map {
  constructor(e, r = VD) {
    if (super(), Object.defineProperties(this, { _intern: { value: /* @__PURE__ */ new Map() }, _key: { value: r } }), e != null) for (const [n, a] of e) this.set(n, a);
  }
  get(e) {
    return super.get(Sx(this, e));
  }
  has(e) {
    return super.has(Sx(this, e));
  }
  set(e, r) {
    return super.set(WD(this, e), r);
  }
  delete(e) {
    return super.delete(GD(this, e));
  }
}
function Sx({ _intern: t, _key: e }, r) {
  const n = e(r);
  return t.has(n) ? t.get(n) : r;
}
function WD({ _intern: t, _key: e }, r) {
  const n = e(r);
  return t.has(n) ? t.get(n) : (t.set(n, r), r);
}
function GD({ _intern: t, _key: e }, r) {
  const n = e(r);
  return t.has(n) && (r = t.get(n), t.delete(n)), r;
}
function VD(t) {
  return t !== null && typeof t == "object" ? t.valueOf() : t;
}
const XD = Math.sqrt(50), YD = Math.sqrt(10), ZD = Math.sqrt(2);
function _d(t, e, r) {
  const n = (e - t) / Math.max(0, r), a = Math.floor(Math.log10(n)), o = n / Math.pow(10, a), l = o >= XD ? 10 : o >= YD ? 5 : o >= ZD ? 2 : 1;
  let u, c, f;
  return a < 0 ? (f = Math.pow(10, -a) / l, u = Math.round(t * f), c = Math.round(e * f), u / f < t && ++u, c / f > e && --c, f = -f) : (f = Math.pow(10, a) * l, u = Math.round(t / f), c = Math.round(e / f), u * f < t && ++u, c * f > e && --c), c < u && 0.5 <= r && r < 2 ? _d(t, e, r * 2) : [u, c, f];
}
function sp(t, e, r) {
  if (e = +e, t = +t, r = +r, !(r > 0)) return [];
  if (t === e) return [t];
  const n = e < t, [a, o, l] = n ? _d(e, t, r) : _d(t, e, r);
  if (!(o >= a)) return [];
  const u = o - a + 1, c = new Array(u);
  if (n)
    if (l < 0) for (let f = 0; f < u; ++f) c[f] = (o - f) / -l;
    else for (let f = 0; f < u; ++f) c[f] = (o - f) * l;
  else if (l < 0) for (let f = 0; f < u; ++f) c[f] = (a + f) / -l;
  else for (let f = 0; f < u; ++f) c[f] = (a + f) * l;
  return c;
}
function up(t, e, r) {
  return e = +e, t = +t, r = +r, _d(t, e, r)[2];
}
function KD(t, e, r) {
  e = +e, t = +t, r = +r;
  const n = e < t, a = n ? up(e, t, r) : up(t, e, r);
  return (n ? -1 : 1) * (a < 0 ? 1 / -a : a);
}
function JD(t, e, r) {
  t = +t, e = +e, r = (a = arguments.length) < 2 ? (e = t, t = 0, 1) : a < 3 ? 1 : +r;
  for (var n = -1, a = Math.max(0, Math.ceil((e - t) / r)) | 0, o = new Array(a); ++n < a; )
    o[n] = t + n * r;
  return o;
}
function Rc(t, e) {
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
const Cx = Symbol("implicit");
function Rk() {
  var t = new kx(), e = [], r = [], n = Cx;
  function a(o) {
    let l = t.get(o);
    if (l === void 0) {
      if (n !== Cx) return n;
      t.set(o, l = e.push(o) - 1);
    }
    return r[l % r.length];
  }
  return a.domain = function(o) {
    if (!arguments.length) return e.slice();
    e = [], t = new kx();
    for (const l of o)
      t.has(l) || t.set(l, e.push(l) - 1);
    return a;
  }, a.range = function(o) {
    return arguments.length ? (r = Array.from(o), a) : r.slice();
  }, a.unknown = function(o) {
    return arguments.length ? (n = o, a) : n;
  }, a.copy = function() {
    return Rk(e, r).unknown(n);
  }, Rc.apply(a, arguments), a;
}
function Tk() {
  var t = Rk().unknown(void 0), e = t.domain, r = t.range, n = 0, a = 1, o, l, u = !1, c = 0, f = 0, h = 0.5;
  delete t.unknown;
  function d() {
    var g = e().length, m = a < n, y = m ? a : n, w = m ? n : a;
    o = (w - y) / Math.max(1, g - c + f * 2), u && (o = Math.floor(o)), y += (w - y - o * (g - c)) * h, l = o * (1 - c), u && (y = Math.round(y), l = Math.round(l));
    var x = JD(g).map(function(_) {
      return y + o * _;
    });
    return r(m ? x.reverse() : x);
  }
  return t.domain = function(g) {
    return arguments.length ? (e(g), d()) : e();
  }, t.range = function(g) {
    return arguments.length ? ([n, a] = g, n = +n, a = +a, d()) : [n, a];
  }, t.rangeRound = function(g) {
    return [n, a] = g, n = +n, a = +a, u = !0, d();
  }, t.bandwidth = function() {
    return l;
  }, t.step = function() {
    return o;
  }, t.round = function(g) {
    return arguments.length ? (u = !!g, d()) : u;
  }, t.padding = function(g) {
    return arguments.length ? (c = Math.min(1, f = +g), d()) : c;
  }, t.paddingInner = function(g) {
    return arguments.length ? (c = Math.min(1, g), d()) : c;
  }, t.paddingOuter = function(g) {
    return arguments.length ? (f = +g, d()) : f;
  }, t.align = function(g) {
    return arguments.length ? (h = Math.max(0, Math.min(1, g)), d()) : h;
  }, t.copy = function() {
    return Tk(e(), [n, a]).round(u).paddingInner(c).paddingOuter(f).align(h);
  }, Rc.apply(d(), arguments);
}
function Tc(t, e, r) {
  t.prototype = e.prototype = r, r.constructor = t;
}
function lh(t, e) {
  var r = Object.create(t.prototype);
  for (var n in e) r[n] = e[n];
  return r;
}
function $l() {
}
var fc = 0.7, kd = 1 / fc, Ns = "\\s*([+-]?\\d+)\\s*", dc = "\\s*([+-]?(?:\\d*\\.)?\\d+(?:[eE][+-]?\\d+)?)\\s*", la = "\\s*([+-]?(?:\\d*\\.)?\\d+(?:[eE][+-]?\\d+)?)%\\s*", QD = /^#([0-9a-f]{3,8})$/, eO = new RegExp(`^rgb\\(${Ns},${Ns},${Ns}\\)$`), tO = new RegExp(`^rgb\\(${la},${la},${la}\\)$`), rO = new RegExp(`^rgba\\(${Ns},${Ns},${Ns},${dc}\\)$`), nO = new RegExp(`^rgba\\(${la},${la},${la},${dc}\\)$`), iO = new RegExp(`^hsl\\(${dc},${la},${la}\\)$`), aO = new RegExp(`^hsla\\(${dc},${la},${la},${dc}\\)$`), Ex = {
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
Tc($l, hc, {
  copy(t) {
    return Object.assign(new this.constructor(), this, t);
  },
  displayable() {
    return this.rgb().displayable();
  },
  hex: Mx,
  // Deprecated! Use color.formatHex.
  formatHex: Mx,
  formatHex8: oO,
  formatHsl: lO,
  formatRgb: Rx,
  toString: Rx
});
function Mx() {
  return this.rgb().formatHex();
}
function oO() {
  return this.rgb().formatHex8();
}
function lO() {
  return Fk(this).formatHsl();
}
function Rx() {
  return this.rgb().formatRgb();
}
function hc(t) {
  var e, r;
  return t = (t + "").trim().toLowerCase(), (e = QD.exec(t)) ? (r = e[1].length, e = parseInt(e[1], 16), r === 6 ? Tx(e) : r === 3 ? new on(e >> 8 & 15 | e >> 4 & 240, e >> 4 & 15 | e & 240, (e & 15) << 4 | e & 15, 1) : r === 8 ? zf(e >> 24 & 255, e >> 16 & 255, e >> 8 & 255, (e & 255) / 255) : r === 4 ? zf(e >> 12 & 15 | e >> 8 & 240, e >> 8 & 15 | e >> 4 & 240, e >> 4 & 15 | e & 240, ((e & 15) << 4 | e & 15) / 255) : null) : (e = eO.exec(t)) ? new on(e[1], e[2], e[3], 1) : (e = tO.exec(t)) ? new on(e[1] * 255 / 100, e[2] * 255 / 100, e[3] * 255 / 100, 1) : (e = rO.exec(t)) ? zf(e[1], e[2], e[3], e[4]) : (e = nO.exec(t)) ? zf(e[1] * 255 / 100, e[2] * 255 / 100, e[3] * 255 / 100, e[4]) : (e = iO.exec(t)) ? Px(e[1], e[2] / 100, e[3] / 100, 1) : (e = aO.exec(t)) ? Px(e[1], e[2] / 100, e[3] / 100, e[4]) : Ex.hasOwnProperty(t) ? Tx(Ex[t]) : t === "transparent" ? new on(NaN, NaN, NaN, 0) : null;
}
function Tx(t) {
  return new on(t >> 16 & 255, t >> 8 & 255, t & 255, 1);
}
function zf(t, e, r, n) {
  return n <= 0 && (t = e = r = NaN), new on(t, e, r, n);
}
function Nk(t) {
  return t instanceof $l || (t = hc(t)), t ? (t = t.rgb(), new on(t.r, t.g, t.b, t.opacity)) : new on();
}
function vc(t, e, r, n) {
  return arguments.length === 1 ? Nk(t) : new on(t, e, r, n ?? 1);
}
function on(t, e, r, n) {
  this.r = +t, this.g = +e, this.b = +r, this.opacity = +n;
}
Tc(on, vc, lh($l, {
  brighter(t) {
    return t = t == null ? kd : Math.pow(kd, t), new on(this.r * t, this.g * t, this.b * t, this.opacity);
  },
  darker(t) {
    return t = t == null ? fc : Math.pow(fc, t), new on(this.r * t, this.g * t, this.b * t, this.opacity);
  },
  rgb() {
    return this;
  },
  clamp() {
    return new on(pl(this.r), pl(this.g), pl(this.b), Sd(this.opacity));
  },
  displayable() {
    return -0.5 <= this.r && this.r < 255.5 && -0.5 <= this.g && this.g < 255.5 && -0.5 <= this.b && this.b < 255.5 && 0 <= this.opacity && this.opacity <= 1;
  },
  hex: Nx,
  // Deprecated! Use color.formatHex.
  formatHex: Nx,
  formatHex8: sO,
  formatRgb: Fx,
  toString: Fx
}));
function Nx() {
  return `#${tl(this.r)}${tl(this.g)}${tl(this.b)}`;
}
function sO() {
  return `#${tl(this.r)}${tl(this.g)}${tl(this.b)}${tl((isNaN(this.opacity) ? 1 : this.opacity) * 255)}`;
}
function Fx() {
  const t = Sd(this.opacity);
  return `${t === 1 ? "rgb(" : "rgba("}${pl(this.r)}, ${pl(this.g)}, ${pl(this.b)}${t === 1 ? ")" : `, ${t})`}`;
}
function Sd(t) {
  return isNaN(t) ? 1 : Math.max(0, Math.min(1, t));
}
function pl(t) {
  return Math.max(0, Math.min(255, Math.round(t) || 0));
}
function tl(t) {
  return t = pl(t), (t < 16 ? "0" : "") + t.toString(16);
}
function Px(t, e, r, n) {
  return n <= 0 ? t = e = r = NaN : r <= 0 || r >= 1 ? t = e = NaN : e <= 0 && (t = NaN), new Li(t, e, r, n);
}
function Fk(t) {
  if (t instanceof Li) return new Li(t.h, t.s, t.l, t.opacity);
  if (t instanceof $l || (t = hc(t)), !t) return new Li();
  if (t instanceof Li) return t;
  t = t.rgb();
  var e = t.r / 255, r = t.g / 255, n = t.b / 255, a = Math.min(e, r, n), o = Math.max(e, r, n), l = NaN, u = o - a, c = (o + a) / 2;
  return u ? (e === o ? l = (r - n) / u + (r < n) * 6 : r === o ? l = (n - e) / u + 2 : l = (e - r) / u + 4, u /= c < 0.5 ? o + a : 2 - o - a, l *= 60) : u = c > 0 && c < 1 ? 0 : l, new Li(l, u, c, t.opacity);
}
function uO(t, e, r, n) {
  return arguments.length === 1 ? Fk(t) : new Li(t, e, r, n ?? 1);
}
function Li(t, e, r, n) {
  this.h = +t, this.s = +e, this.l = +r, this.opacity = +n;
}
Tc(Li, uO, lh($l, {
  brighter(t) {
    return t = t == null ? kd : Math.pow(kd, t), new Li(this.h, this.s, this.l * t, this.opacity);
  },
  darker(t) {
    return t = t == null ? fc : Math.pow(fc, t), new Li(this.h, this.s, this.l * t, this.opacity);
  },
  rgb() {
    var t = this.h % 360 + (this.h < 0) * 360, e = isNaN(t) || isNaN(this.s) ? 0 : this.s, r = this.l, n = r + (r < 0.5 ? r : 1 - r) * e, a = 2 * r - n;
    return new on(
      gv(t >= 240 ? t - 240 : t + 120, a, n),
      gv(t, a, n),
      gv(t < 120 ? t + 240 : t - 120, a, n),
      this.opacity
    );
  },
  clamp() {
    return new Li(zx(this.h), Df(this.s), Df(this.l), Sd(this.opacity));
  },
  displayable() {
    return (0 <= this.s && this.s <= 1 || isNaN(this.s)) && 0 <= this.l && this.l <= 1 && 0 <= this.opacity && this.opacity <= 1;
  },
  formatHsl() {
    const t = Sd(this.opacity);
    return `${t === 1 ? "hsl(" : "hsla("}${zx(this.h)}, ${Df(this.s) * 100}%, ${Df(this.l) * 100}%${t === 1 ? ")" : `, ${t})`}`;
  }
}));
function zx(t) {
  return t = (t || 0) % 360, t < 0 ? t + 360 : t;
}
function Df(t) {
  return Math.max(0, Math.min(1, t || 0));
}
function gv(t, e, r) {
  return (t < 60 ? e + (r - e) * t / 60 : t < 180 ? r : t < 240 ? e + (r - e) * (240 - t) / 60 : e) * 255;
}
const cO = Math.PI / 180, fO = 180 / Math.PI, Cd = 18, Pk = 0.96422, zk = 1, Dk = 0.82521, Ok = 4 / 29, Fs = 6 / 29, Lk = 3 * Fs * Fs, dO = Fs * Fs * Fs;
function Bk(t) {
  if (t instanceof sa) return new sa(t.l, t.a, t.b, t.opacity);
  if (t instanceof Fa) return qk(t);
  t instanceof on || (t = Nk(t));
  var e = xv(t.r), r = xv(t.g), n = xv(t.b), a = mv((0.2225045 * e + 0.7168786 * r + 0.0606169 * n) / zk), o, l;
  return e === r && r === n ? o = l = a : (o = mv((0.4360747 * e + 0.3850649 * r + 0.1430804 * n) / Pk), l = mv((0.0139322 * e + 0.0971045 * r + 0.7141733 * n) / Dk)), new sa(116 * a - 16, 500 * (o - a), 200 * (a - l), t.opacity);
}
function Ak(t, e, r, n) {
  return arguments.length === 1 ? Bk(t) : new sa(t, e, r, n ?? 1);
}
function sa(t, e, r, n) {
  this.l = +t, this.a = +e, this.b = +r, this.opacity = +n;
}
Tc(sa, Ak, lh($l, {
  brighter(t) {
    return new sa(this.l + Cd * (t ?? 1), this.a, this.b, this.opacity);
  },
  darker(t) {
    return new sa(this.l - Cd * (t ?? 1), this.a, this.b, this.opacity);
  },
  rgb() {
    var t = (this.l + 16) / 116, e = isNaN(this.a) ? t : t + this.a / 500, r = isNaN(this.b) ? t : t - this.b / 200;
    return e = Pk * yv(e), t = zk * yv(t), r = Dk * yv(r), new on(
      bv(3.1338561 * e - 1.6168667 * t - 0.4906146 * r),
      bv(-0.9787684 * e + 1.9161415 * t + 0.033454 * r),
      bv(0.0719453 * e - 0.2289914 * t + 1.4052427 * r),
      this.opacity
    );
  }
}));
function mv(t) {
  return t > dO ? Math.pow(t, 1 / 3) : t / Lk + Ok;
}
function yv(t) {
  return t > Fs ? t * t * t : Lk * (t - Ok);
}
function bv(t) {
  return 255 * (t <= 31308e-7 ? 12.92 * t : 1.055 * Math.pow(t, 1 / 2.4) - 0.055);
}
function xv(t) {
  return (t /= 255) <= 0.04045 ? t / 12.92 : Math.pow((t + 0.055) / 1.055, 2.4);
}
function hO(t) {
  if (t instanceof Fa) return new Fa(t.h, t.c, t.l, t.opacity);
  if (t instanceof sa || (t = Bk(t)), t.a === 0 && t.b === 0) return new Fa(NaN, 0 < t.l && t.l < 100 ? 0 : NaN, t.l, t.opacity);
  var e = Math.atan2(t.b, t.a) * fO;
  return new Fa(e < 0 ? e + 360 : e, Math.sqrt(t.a * t.a + t.b * t.b), t.l, t.opacity);
}
function vO(t, e, r, n) {
  return arguments.length === 1 ? hO(t) : new Fa(t, e, r, n ?? 1);
}
function Fa(t, e, r, n) {
  this.h = +t, this.c = +e, this.l = +r, this.opacity = +n;
}
function qk(t) {
  if (isNaN(t.h)) return new sa(t.l, 0, 0, t.opacity);
  var e = t.h * cO;
  return new sa(t.l, Math.cos(e) * t.c, Math.sin(e) * t.c, t.opacity);
}
Tc(Fa, vO, lh($l, {
  brighter(t) {
    return new Fa(this.h, this.c, this.l + Cd * (t ?? 1), this.opacity);
  },
  darker(t) {
    return new Fa(this.h, this.c, this.l - Cd * (t ?? 1), this.opacity);
  },
  rgb() {
    return qk(this).rgb();
  }
}));
function pO(t, e, r, n, a) {
  var o = t * t, l = o * t;
  return ((1 - 3 * t + 3 * o - l) * e + (4 - 6 * o + 3 * l) * r + (1 + 3 * t + 3 * o - 3 * l) * n + l * a) / 6;
}
function gO(t) {
  var e = t.length - 1;
  return function(r) {
    var n = r <= 0 ? r = 0 : r >= 1 ? (r = 1, e - 1) : Math.floor(r * e), a = t[n], o = t[n + 1], l = n > 0 ? t[n - 1] : 2 * a - o, u = n < e - 1 ? t[n + 2] : 2 * o - a;
    return pO((r - n / e) * e, l, a, o, u);
  };
}
const Ug = (t) => () => t;
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
  return (t = +t) == 1 ? jk : function(e, r) {
    return r - e ? yO(e, r, t) : Ug(isNaN(e) ? r : e);
  };
}
function jk(t, e) {
  var r = e - t;
  return r ? mO(t, r) : Ug(isNaN(t) ? e : t);
}
const Dx = function t(e) {
  var r = bO(e);
  function n(a, o) {
    var l = r((a = vc(a)).r, (o = vc(o)).r), u = r(a.g, o.g), c = r(a.b, o.b), f = jk(a.opacity, o.opacity);
    return function(h) {
      return a.r = l(h), a.g = u(h), a.b = c(h), a.opacity = f(h), a + "";
    };
  }
  return n.gamma = t, n;
}(1);
function xO(t) {
  return function(e) {
    var r = e.length, n = new Array(r), a = new Array(r), o = new Array(r), l, u;
    for (l = 0; l < r; ++l)
      u = vc(e[l]), n[l] = u.r || 0, a[l] = u.g || 0, o[l] = u.b || 0;
    return n = t(n), a = t(a), o = t(o), u.opacity = 1, function(c) {
      return u.r = n(c), u.g = a(c), u.b = o(c), u + "";
    };
  };
}
var wO = xO(gO);
function _O(t, e) {
  e || (e = []);
  var r = t ? Math.min(e.length, t.length) : 0, n = e.slice(), a;
  return function(o) {
    for (a = 0; a < r; ++a) n[a] = t[a] * (1 - o) + e[a] * o;
    return n;
  };
}
function kO(t) {
  return ArrayBuffer.isView(t) && !(t instanceof DataView);
}
function SO(t, e) {
  var r = e ? e.length : 0, n = t ? Math.min(r, t.length) : 0, a = new Array(n), o = new Array(r), l;
  for (l = 0; l < n; ++l) a[l] = Ig(t[l], e[l]);
  for (; l < r; ++l) o[l] = e[l];
  return function(u) {
    for (l = 0; l < n; ++l) o[l] = a[l](u);
    return o;
  };
}
function CO(t, e) {
  var r = /* @__PURE__ */ new Date();
  return t = +t, e = +e, function(n) {
    return r.setTime(t * (1 - n) + e * n), r;
  };
}
function Ed(t, e) {
  return t = +t, e = +e, function(r) {
    return t * (1 - r) + e * r;
  };
}
function EO(t, e) {
  var r = {}, n = {}, a;
  (t === null || typeof t != "object") && (t = {}), (e === null || typeof e != "object") && (e = {});
  for (a in e)
    a in t ? r[a] = Ig(t[a], e[a]) : n[a] = e[a];
  return function(o) {
    for (a in r) n[a] = r[a](o);
    return n;
  };
}
var cp = /[-+]?(?:\d+\.?\d*|\.?\d+)(?:[eE][-+]?\d+)?/g, wv = new RegExp(cp.source, "g");
function MO(t) {
  return function() {
    return t;
  };
}
function RO(t) {
  return function(e) {
    return t(e) + "";
  };
}
function TO(t, e) {
  var r = cp.lastIndex = wv.lastIndex = 0, n, a, o, l = -1, u = [], c = [];
  for (t = t + "", e = e + ""; (n = cp.exec(t)) && (a = wv.exec(e)); )
    (o = a.index) > r && (o = e.slice(r, o), u[l] ? u[l] += o : u[++l] = o), (n = n[0]) === (a = a[0]) ? u[l] ? u[l] += a : u[++l] = a : (u[++l] = null, c.push({ i: l, x: Ed(n, a) })), r = wv.lastIndex;
  return r < e.length && (o = e.slice(r), u[l] ? u[l] += o : u[++l] = o), u.length < 2 ? c[0] ? RO(c[0].x) : MO(e) : (e = c.length, function(f) {
    for (var h = 0, d; h < e; ++h) u[(d = c[h]).i] = d.x(f);
    return u.join("");
  });
}
function Ig(t, e) {
  var r = typeof e, n;
  return e == null || r === "boolean" ? Ug(e) : (r === "number" ? Ed : r === "string" ? (n = hc(e)) ? (e = n, Dx) : TO : e instanceof hc ? Dx : e instanceof Date ? CO : kO(e) ? _O : Array.isArray(e) ? SO : typeof e.valueOf != "function" && typeof e.toString != "function" || isNaN(e) ? EO : Ed)(t, e);
}
function NO(t, e) {
  return t = +t, e = +e, function(r) {
    return Math.round(t * (1 - r) + e * r);
  };
}
function FO(t) {
  return function() {
    return t;
  };
}
function PO(t) {
  return +t;
}
var Ox = [0, 1];
function bs(t) {
  return t;
}
function fp(t, e) {
  return (e -= t = +t) ? function(r) {
    return (r - t) / e;
  } : FO(isNaN(e) ? NaN : 0.5);
}
function zO(t, e) {
  var r;
  return t > e && (r = t, t = e, e = r), function(n) {
    return Math.max(t, Math.min(e, n));
  };
}
function DO(t, e, r) {
  var n = t[0], a = t[1], o = e[0], l = e[1];
  return a < n ? (n = fp(a, n), o = r(l, o)) : (n = fp(n, a), o = r(o, l)), function(u) {
    return o(n(u));
  };
}
function OO(t, e, r) {
  var n = Math.min(t.length, e.length) - 1, a = new Array(n), o = new Array(n), l = -1;
  for (t[n] < t[0] && (t = t.slice().reverse(), e = e.slice().reverse()); ++l < n; )
    a[l] = fp(t[l], t[l + 1]), o[l] = r(e[l], e[l + 1]);
  return function(u) {
    var c = HD(t, u, 1, n) - 1;
    return o[c](a[c](u));
  };
}
function Hg(t, e) {
  return e.domain(t.domain()).range(t.range()).interpolate(t.interpolate()).clamp(t.clamp()).unknown(t.unknown());
}
function Wg() {
  var t = Ox, e = Ox, r = Ig, n, a, o, l = bs, u, c, f;
  function h() {
    var g = Math.min(t.length, e.length);
    return l !== bs && (l = zO(t[0], t[g - 1])), u = g > 2 ? OO : DO, c = f = null, d;
  }
  function d(g) {
    return g == null || isNaN(g = +g) ? o : (c || (c = u(t.map(n), e, r)))(n(l(g)));
  }
  return d.invert = function(g) {
    return l(a((f || (f = u(e, t.map(n), Ed)))(g)));
  }, d.domain = function(g) {
    return arguments.length ? (t = Array.from(g, PO), h()) : t.slice();
  }, d.range = function(g) {
    return arguments.length ? (e = Array.from(g), h()) : e.slice();
  }, d.rangeRound = function(g) {
    return e = Array.from(g), r = NO, h();
  }, d.clamp = function(g) {
    return arguments.length ? (l = g ? !0 : bs, h()) : l !== bs;
  }, d.interpolate = function(g) {
    return arguments.length ? (r = g, h()) : r;
  }, d.unknown = function(g) {
    return arguments.length ? (o = g, d) : o;
  }, function(g, m) {
    return n = g, a = m, h();
  };
}
function LO() {
  return Wg()(bs, bs);
}
function BO(t, e, r, n) {
  var a = KD(t, e, r), o;
  switch (n = cc(n ?? ",f"), n.type) {
    case "s": {
      var l = Math.max(Math.abs(t), Math.abs(e));
      return n.precision == null && !isNaN(o = AD(a, l)) && (n.precision = o), Ek(n, l);
    }
    case "":
    case "e":
    case "g":
    case "p":
    case "r": {
      n.precision == null && !isNaN(o = qD(a, Math.max(Math.abs(t), Math.abs(e)))) && (n.precision = o - (n.type === "e"));
      break;
    }
    case "f":
    case "%": {
      n.precision == null && !isNaN(o = BD(a)) && (n.precision = o - (n.type === "%") * 2);
      break;
    }
  }
  return Xa(n);
}
function $k(t) {
  var e = t.domain;
  return t.ticks = function(r) {
    var n = e();
    return sp(n[0], n[n.length - 1], r ?? 10);
  }, t.tickFormat = function(r, n) {
    var a = e();
    return BO(a[0], a[a.length - 1], r ?? 10, n);
  }, t.nice = function(r) {
    r == null && (r = 10);
    var n = e(), a = 0, o = n.length - 1, l = n[a], u = n[o], c, f, h = 10;
    for (u < l && (f = l, l = u, u = f, f = a, a = o, o = f); h-- > 0; ) {
      if (f = up(l, u, r), f === c)
        return n[a] = l, n[o] = u, e(n);
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
function Ks() {
  var t = LO();
  return t.copy = function() {
    return Hg(t, Ks());
  }, Rc.apply(t, arguments), $k(t);
}
function AO(t, e) {
  t = t.slice();
  var r = 0, n = t.length - 1, a = t[r], o = t[n], l;
  return o < a && (l = r, r = n, n = l, l = a, a = o, o = l), t[r] = e.floor(a), t[n] = e.ceil(o), t;
}
function Lx(t) {
  return Math.log(t);
}
function Bx(t) {
  return Math.exp(t);
}
function qO(t) {
  return -Math.log(-t);
}
function jO(t) {
  return -Math.exp(-t);
}
function $O(t) {
  return isFinite(t) ? +("1e" + t) : t < 0 ? 0 : t;
}
function UO(t) {
  return t === 10 ? $O : t === Math.E ? Math.exp : (e) => Math.pow(t, e);
}
function IO(t) {
  return t === Math.E ? Math.log : t === 10 && Math.log10 || t === 2 && Math.log2 || (t = Math.log(t), (e) => Math.log(e) / t);
}
function Ax(t) {
  return (e, r) => -t(-e, r);
}
function HO(t) {
  const e = t(Lx, Bx), r = e.domain;
  let n = 10, a, o;
  function l() {
    return a = IO(n), o = UO(n), r()[0] < 0 ? (a = Ax(a), o = Ax(o), t(qO, jO)) : t(Lx, Bx), e;
  }
  return e.base = function(u) {
    return arguments.length ? (n = +u, l()) : n;
  }, e.domain = function(u) {
    return arguments.length ? (r(u), l()) : r();
  }, e.ticks = (u) => {
    const c = r();
    let f = c[0], h = c[c.length - 1];
    const d = h < f;
    d && ([f, h] = [h, f]);
    let g = a(f), m = a(h), y, w;
    const x = u == null ? 10 : +u;
    let _ = [];
    if (!(n % 1) && m - g < x) {
      if (g = Math.floor(g), m = Math.ceil(m), f > 0) {
        for (; g <= m; ++g)
          for (y = 1; y < n; ++y)
            if (w = g < 0 ? y / o(-g) : y * o(g), !(w < f)) {
              if (w > h) break;
              _.push(w);
            }
      } else for (; g <= m; ++g)
        for (y = n - 1; y >= 1; --y)
          if (w = g > 0 ? y / o(-g) : y * o(g), !(w < f)) {
            if (w > h) break;
            _.push(w);
          }
      _.length * 2 < x && (_ = sp(f, h, x));
    } else
      _ = sp(g, m, Math.min(m - g, x)).map(o);
    return d ? _.reverse() : _;
  }, e.tickFormat = (u, c) => {
    if (u == null && (u = 10), c == null && (c = n === 10 ? "s" : ","), typeof c != "function" && (!(n % 1) && (c = cc(c)).precision == null && (c.trim = !0), c = Xa(c)), u === 1 / 0) return c;
    const f = Math.max(1, n * u / e.ticks().length);
    return (h) => {
      let d = h / o(Math.round(a(h)));
      return d * n < n - 0.5 && (d *= n), d <= f ? c(h) : "";
    };
  }, e.nice = () => r(AO(r(), {
    floor: (u) => o(Math.floor(a(u))),
    ceil: (u) => o(Math.ceil(a(u)))
  })), e;
}
function pc() {
  const t = HO(Wg()).domain([1, 10]);
  return t.copy = () => Hg(t, pc()).base(t.base()), Rc.apply(t, arguments), t;
}
function qx(t) {
  return function(e) {
    return Math.sign(e) * Math.log1p(Math.abs(e / t));
  };
}
function jx(t) {
  return function(e) {
    return Math.sign(e) * Math.expm1(Math.abs(e)) * t;
  };
}
function WO(t) {
  var e = 1, r = t(qx(e), jx(e));
  return r.constant = function(n) {
    return arguments.length ? t(qx(e = +n), jx(e)) : e;
  }, $k(r);
}
function Uk() {
  var t = WO(Wg());
  return t.copy = function() {
    return Hg(t, Uk()).constant(t.constant());
  }, Rc.apply(t, arguments);
}
function Js(t) {
  for (var e = t.length / 6 | 0, r = new Array(e), n = 0; n < e; ) r[n] = "#" + t.slice(n * 6, ++n * 6);
  return r;
}
const Ik = (t) => wO(t[t.length - 1]);
var GO = new Array(3).concat(
  "ece2f0a6bddb1c9099",
  "f6eff7bdc9e167a9cf02818a",
  "f6eff7bdc9e167a9cf1c9099016c59",
  "f6eff7d0d1e6a6bddb67a9cf1c9099016c59",
  "f6eff7d0d1e6a6bddb67a9cf3690c002818a016450",
  "fff7fbece2f0d0d1e6a6bddb67a9cf3690c002818a016450",
  "fff7fbece2f0d0d1e6a6bddb67a9cf3690c002818a016c59014636"
).map(Js);
const VO = Ik(GO);
var XO = new Array(3).concat(
  "edf8b17fcdbb2c7fb8",
  "ffffcca1dab441b6c4225ea8",
  "ffffcca1dab441b6c42c7fb8253494",
  "ffffccc7e9b47fcdbb41b6c42c7fb8253494",
  "ffffccc7e9b47fcdbb41b6c41d91c0225ea80c2c84",
  "ffffd9edf8b1c7e9b47fcdbb41b6c41d91c0225ea80c2c84",
  "ffffd9edf8b1c7e9b47fcdbb41b6c41d91c0225ea8253494081d58"
).map(Js);
const YO = Ik(XO);
function ZO(t) {
  return t = Math.max(0, Math.min(1, t)), "rgb(" + Math.max(0, Math.min(255, Math.round(34.61 + t * (1172.33 - t * (10793.56 - t * (33300.12 - t * (38394.49 - t * 14825.05))))))) + ", " + Math.max(0, Math.min(255, Math.round(23.31 + t * (557.33 + t * (1225.33 - t * (3574.96 - t * (1073.77 + t * 707.56))))))) + ", " + Math.max(0, Math.min(255, Math.round(27.2 + t * (3211.1 - t * (15327.97 - t * (27814 - t * (22569.18 - t * 6838.66))))))) + ")";
}
function sh(t) {
  var e = t.length;
  return function(r) {
    return t[Math.max(0, Math.min(e - 1, Math.floor(r * e)))];
  };
}
sh(Js("44015444025645045745055946075a46085c460a5d460b5e470d60470e6147106347116447136548146748166848176948186a481a6c481b6d481c6e481d6f481f70482071482173482374482475482576482677482878482979472a7a472c7a472d7b472e7c472f7d46307e46327e46337f463480453581453781453882443983443a83443b84433d84433e85423f854240864241864142874144874045884046883f47883f48893e49893e4a893e4c8a3d4d8a3d4e8a3c4f8a3c508b3b518b3b528b3a538b3a548c39558c39568c38588c38598c375a8c375b8d365c8d365d8d355e8d355f8d34608d34618d33628d33638d32648e32658e31668e31678e31688e30698e306a8e2f6b8e2f6c8e2e6d8e2e6e8e2e6f8e2d708e2d718e2c718e2c728e2c738e2b748e2b758e2a768e2a778e2a788e29798e297a8e297b8e287c8e287d8e277e8e277f8e27808e26818e26828e26828e25838e25848e25858e24868e24878e23888e23898e238a8d228b8d228c8d228d8d218e8d218f8d21908d21918c20928c20928c20938c1f948c1f958b1f968b1f978b1f988b1f998a1f9a8a1e9b8a1e9c891e9d891f9e891f9f881fa0881fa1881fa1871fa28720a38620a48621a58521a68522a78522a88423a98324aa8325ab8225ac8226ad8127ad8128ae8029af7f2ab07f2cb17e2db27d2eb37c2fb47c31b57b32b67a34b67935b77937b87838b9773aba763bbb753dbc743fbc7340bd7242be7144bf7046c06f48c16e4ac16d4cc26c4ec36b50c46a52c56954c56856c66758c7655ac8645cc8635ec96260ca6063cb5f65cb5e67cc5c69cd5b6ccd5a6ece5870cf5773d05675d05477d1537ad1517cd2507fd34e81d34d84d44b86d54989d5488bd6468ed64590d74393d74195d84098d83e9bd93c9dd93ba0da39a2da37a5db36a8db34aadc32addc30b0dd2fb2dd2db5de2bb8de29bade28bddf26c0df25c2df23c5e021c8e020cae11fcde11dd0e11cd2e21bd5e21ad8e219dae319dde318dfe318e2e418e5e419e7e419eae51aece51befe51cf1e51df4e61ef6e620f8e621fbe723fde725"));
sh(Js("00000401000501010601010802010902020b02020d03030f03031204041405041606051806051a07061c08071e0907200a08220b09240c09260d0a290e0b2b100b2d110c2f120d31130d34140e36150e38160f3b180f3d19103f1a10421c10441d11471e114920114b21114e22115024125325125527125829115a2a115c2c115f2d11612f116331116533106734106936106b38106c390f6e3b0f703d0f713f0f72400f74420f75440f764510774710784910784a10794c117a4e117b4f127b51127c52137c54137d56147d57157e59157e5a167e5c167f5d177f5f187f601880621980641a80651a80671b80681c816a1c816b1d816d1d816e1e81701f81721f817320817521817621817822817922827b23827c23827e24828025828125818326818426818627818827818928818b29818c29818e2a81902a81912b81932b80942c80962c80982d80992d809b2e7f9c2e7f9e2f7fa02f7fa1307ea3307ea5317ea6317da8327daa337dab337cad347cae347bb0357bb2357bb3367ab5367ab73779b83779ba3878bc3978bd3977bf3a77c03a76c23b75c43c75c53c74c73d73c83e73ca3e72cc3f71cd4071cf4070d0416fd2426fd3436ed5446dd6456cd8456cd9466bdb476adc4869de4968df4a68e04c67e24d66e34e65e44f64e55064e75263e85362e95462ea5661eb5760ec5860ed5a5fee5b5eef5d5ef05f5ef1605df2625df2645cf3655cf4675cf4695cf56b5cf66c5cf66e5cf7705cf7725cf8745cf8765cf9785df9795df97b5dfa7d5efa7f5efa815ffb835ffb8560fb8761fc8961fc8a62fc8c63fc8e64fc9065fd9266fd9467fd9668fd9869fd9a6afd9b6bfe9d6cfe9f6dfea16efea36ffea571fea772fea973feaa74feac76feae77feb078feb27afeb47bfeb67cfeb77efeb97ffebb81febd82febf84fec185fec287fec488fec68afec88cfeca8dfecc8ffecd90fecf92fed194fed395fed597fed799fed89afdda9cfddc9efddea0fde0a1fde2a3fde3a5fde5a7fde7a9fde9aafdebacfcecaefceeb0fcf0b2fcf2b4fcf4b6fcf6b8fcf7b9fcf9bbfcfbbdfcfdbf"));
var Hk = sh(Js("00000401000501010601010802010a02020c02020e03021004031204031405041706041907051b08051d09061f0a07220b07240c08260d08290e092b10092d110a30120a32140b34150b37160b39180c3c190c3e1b0c411c0c431e0c451f0c48210c4a230c4c240c4f260c51280b53290b552b0b572d0b592f0a5b310a5c320a5e340a5f3609613809623909633b09643d09653e0966400a67420a68440a68450a69470b6a490b6a4a0c6b4c0c6b4d0d6c4f0d6c510e6c520e6d540f6d550f6d57106e59106e5a116e5c126e5d126e5f136e61136e62146e64156e65156e67166e69166e6a176e6c186e6d186e6f196e71196e721a6e741a6e751b6e771c6d781c6d7a1d6d7c1d6d7d1e6d7f1e6c801f6c82206c84206b85216b87216b88226a8a226a8c23698d23698f24699025689225689326679526679727669827669a28659b29649d29649f2a63a02a63a22b62a32c61a52c60a62d60a82e5fa92e5eab2f5ead305dae305cb0315bb1325ab3325ab43359b63458b73557b93556ba3655bc3754bd3853bf3952c03a51c13a50c33b4fc43c4ec63d4dc73e4cc83f4bca404acb4149cc4248ce4347cf4446d04545d24644d34743d44842d54a41d74b3fd84c3ed94d3dda4e3cdb503bdd513ade5238df5337e05536e15635e25734e35933e45a31e55c30e65d2fe75e2ee8602de9612bea632aeb6429eb6628ec6726ed6925ee6a24ef6c23ef6e21f06f20f1711ff1731df2741cf3761bf37819f47918f57b17f57d15f67e14f68013f78212f78410f8850ff8870ef8890cf98b0bf98c0af98e09fa9008fa9207fa9407fb9606fb9706fb9906fb9b06fb9d07fc9f07fca108fca309fca50afca60cfca80dfcaa0ffcac11fcae12fcb014fcb216fcb418fbb61afbb81dfbba1ffbbc21fbbe23fac026fac228fac42afac62df9c72ff9c932f9cb35f8cd37f8cf3af7d13df7d340f6d543f6d746f5d949f5db4cf4dd4ff4df53f4e156f3e35af3e55df2e661f2e865f2ea69f1ec6df1ed71f1ef75f1f179f2f27df2f482f3f586f3f68af4f88ef5f992f6fa96f8fb9af9fc9dfafda1fcffa4"));
sh(Js("0d088710078813078916078a19068c1b068d1d068e20068f2206902406912605912805922a05932c05942e05952f059631059733059735049837049938049a3a049a3c049b3e049c3f049c41049d43039e44039e46039f48039f4903a04b03a14c02a14e02a25002a25102a35302a35502a45601a45801a45901a55b01a55c01a65e01a66001a66100a76300a76400a76600a76700a86900a86a00a86c00a86e00a86f00a87100a87201a87401a87501a87701a87801a87a02a87b02a87d03a87e03a88004a88104a78305a78405a78606a68707a68808a68a09a58b0aa58d0ba58e0ca48f0da4910ea3920fa39410a29511a19613a19814a099159f9a169f9c179e9d189d9e199da01a9ca11b9ba21d9aa31e9aa51f99a62098a72197a82296aa2395ab2494ac2694ad2793ae2892b02991b12a90b22b8fb32c8eb42e8db52f8cb6308bb7318ab83289ba3388bb3488bc3587bd3786be3885bf3984c03a83c13b82c23c81c33d80c43e7fc5407ec6417dc7427cc8437bc9447aca457acb4679cc4778cc4977cd4a76ce4b75cf4c74d04d73d14e72d24f71d35171d45270d5536fd5546ed6556dd7566cd8576bd9586ada5a6ada5b69db5c68dc5d67dd5e66de5f65de6164df6263e06363e16462e26561e26660e3685fe4695ee56a5de56b5de66c5ce76e5be76f5ae87059e97158e97257ea7457eb7556eb7655ec7754ed7953ed7a52ee7b51ef7c51ef7e50f07f4ff0804ef1814df1834cf2844bf3854bf3874af48849f48948f58b47f58c46f68d45f68f44f79044f79143f79342f89441f89540f9973ff9983ef99a3efa9b3dfa9c3cfa9e3bfb9f3afba139fba238fca338fca537fca636fca835fca934fdab33fdac33fdae32fdaf31fdb130fdb22ffdb42ffdb52efeb72dfeb82cfeba2cfebb2bfebd2afebe2afec029fdc229fdc328fdc527fdc627fdc827fdca26fdcb26fccd25fcce25fcd025fcd225fbd324fbd524fbd724fad824fada24f9dc24f9dd25f8df25f8e125f7e225f7e425f6e626f6e826f5e926f5eb27f4ed27f3ee27f3f027f2f227f1f426f1f525f0f724f0f921"));
function Wk(t) {
  let e = [];
  for (let r = 0; r < t; r++)
    e.push(ZO((r + 0.5) / t));
  return e;
}
const Gk = "system-ui", dp = 11, KO = 80;
let Mu;
function JO() {
  return Mu == null && (Mu = document.createElement("canvas"), Mu.width = 1, Mu.height = 1), Mu.getContext("2d");
}
function hp(t) {
  let e = JO();
  e.font = `${dp}px ${Gk}`;
  let r = e.measureText(t);
  return {
    width: Math.min(KO, r.width),
    height: dp
  };
}
function Vk(t, e, r = 0) {
  let n = 0, a = 0;
  for (let o of t) {
    let { width: l, height: u } = o.size;
    n = Math.max(n, l), a = Math.max(a, u);
  }
  switch (e) {
    case "x":
      return { left: n / 2, right: n / 2, top: 0, bottom: a + r };
    case "y":
      return { left: n + r, right: 0, top: a / 2, bottom: a / 2 };
  }
}
function $x(t, e, r) {
  switch (t.type) {
    case "band":
      return QO(t, e, r);
    default:
      return eL(t, e, r);
  }
}
function QO(t, e, r) {
  let n = [...t.domain, ...t.specialValues ?? []];
  n = Array.from(new Set(n)), r == "y" && (n = n.reverse());
  let a = Tk().domain(n).padding(0.1), o = [], l = [], u = { left: 0, right: 0, top: 0, bottom: 0 };
  if (e) {
    let c = e.values ?? a.domain(), f = e.labelPadding ?? 6;
    o = c.map((h) => {
      let { width: d, height: g } = hp(h);
      return r == "y" ? {
        text: h,
        value: h,
        padding: f,
        level: 0,
        size: { width: d, height: g },
        orientation: "horizontal"
      } : {
        text: h,
        value: h,
        padding: f,
        level: 0,
        size: { width: g, height: d },
        orientation: "vertical"
      };
    }), l = c.map((h) => ({ value: h, level: 0 })), u = Gg([u, Vk(o, r, f)]);
  }
  return {
    extents: u,
    labels: o,
    gridLines: [],
    ticks: l,
    concrete: (c) => rL(a, t.domain, t.specialValues ?? [], c)
  };
}
function eL(t, e, r) {
  let n;
  switch (t.type) {
    case "linear": {
      n = Ks().domain(t.domain);
      break;
    }
    case "log": {
      n = pc().domain(t.domain);
      break;
    }
    case "symlog": {
      let u = t.constant ?? 1;
      n = Uk().constant(u).domain(t.domain), n.nice = () => n, n.ticks = (c) => nL(n.domain(), u, c), n.tickFormat = () => Xa("~s");
      break;
    }
    default:
      throw new Error("invalid scale type");
  }
  let a = [], o = [], l = { left: 0, right: 0, top: 0, bottom: 0 };
  if (e) {
    let u = [];
    if (e.extendScaleToTicks ?? !0)
      if (e.values) {
        u = e.values;
        let d = n.domain().concat(u);
        n = n.domain([
          d.reduce((g, m) => Math.min(g, m), d[0]),
          d.reduce((g, m) => Math.max(g, m), d[0])
        ]);
      } else {
        let d = e.desiredTickCount ?? 5;
        n.nice && (n = n.nice(d)), u = n.ticks(d);
      }
    else {
      if (e.values)
        u = e.values;
      else {
        let m = e.desiredTickCount ?? 5;
        u = n.ticks(m);
      }
      let [d, g] = n.domain();
      u = u.filter((m) => m >= d && m <= g);
    }
    let c = e.labelPadding ?? 6, f = n.tickFormat(e.values ? e.values.length : e.desiredTickCount ?? 5), h = (d) => t.type == "log" || t.type == "symlog" ? Math.round(Math.log10(Math.abs(d))) == Math.log10(Math.abs(d)) ? 0 : 1 : 0;
    a = u.map((d) => {
      let g = f(d);
      return {
        text: g,
        value: d,
        padding: c,
        level: h(d),
        size: hp(g),
        orientation: "horizontal"
      };
    });
    for (let d of t.specialValues ?? [])
      a.push({
        text: d,
        value: d,
        padding: c,
        level: 0,
        size: hp(d),
        orientation: "horizontal"
      });
    o = u.map((d) => ({ value: d, level: h(d) })), l = Gg([l, Vk(a, r, c)]);
  }
  return {
    extents: l,
    labels: a,
    gridLines: o,
    ticks: o,
    concrete: (u) => tL(n, t.specialValues ?? [], u)
  };
}
function Gg(t) {
  let e = { left: 0, right: 0, top: 0, bottom: 0 };
  for (let r of t)
    e.left = Math.max(e.left, r.left), e.right = Math.max(e.right, r.right), e.top = Math.max(e.top, r.top), e.bottom = Math.max(e.bottom, r.bottom);
  return e;
}
function Ux(t, e, r = {}) {
  let n = r.gap ?? 0, a = t.map((u, c) => ({ ...e(u), index: c })).sort((u, c) => u.priority - c.priority), o = t.map((u) => !1), l = (u, c) => Math.abs(u.center - c.center) < n + u.length / 2 + c.length / 2;
  for (let u = 0; u < a.length; u++) {
    let c = !1;
    for (let f = 0; f < u; f++)
      if (o[a[f].index] && l(a[u], a[f])) {
        c = !0;
        break;
      }
    o[a[u].index] = !c;
  }
  return t.filter((u, c) => o[c]);
}
function tL(t, e, r) {
  e = Array.from(new Set(e));
  let n = r[0], a = r[1], o = /* @__PURE__ */ new Map(), l;
  if (e.length > 0) {
    let c = 22, f = 8, h = 20, d = e.length * h, g = 2, m = n;
    n < a ? (n = n + d + c, l = [m, m + d + c - f]) : (n = n - d - c, m = n + c, l = [m - c + f, m + d]);
    for (let y = 0; y < e.length; y++)
      o.set(e[y], [m + y * h + g, m + y * h + h - g]);
  }
  let u = t.copy().range([n, a]);
  return {
    domain: t.domain(),
    specialValues: e ?? [],
    range: [n, a],
    rangeBands: [[n, a], ...l ? [l] : []],
    apply: (c) => {
      let f = o.get(c);
      return f != null ? (f[0] + f[1]) / 2 : u(c);
    },
    applyBand: (c) => {
      let f = o.get(c);
      if (f != null)
        return f;
      if (typeof c != "number")
        return [u(c[0]), u(c[1])];
      {
        let h = u(c);
        return [h, h];
      }
    },
    invert: (c, f) => {
      if (f != "number") {
        for (let [h, d] of o.entries())
          if (c >= Math.min(...d) && c <= Math.max(...d))
            return h;
      }
      return u.invert(c);
    }
  };
}
function rL(t, e, r, n) {
  let a = n[0], o = n[1], l = t.copy().range(n), u = l.bandwidth(), c = l.step();
  return {
    domain: e,
    specialValues: r,
    range: [a, o],
    rangeBands: [[a, o]],
    apply: (f) => (l(f) ?? 0) + u / 2,
    applyBand: (f) => {
      let h = l(f) ?? 0;
      return [h, h + u];
    },
    invert: (f) => {
      let h = (f - a) / (o - a), d = Math.floor(h * Math.abs(o - a) / c);
      return t.domain()[d];
    }
  };
}
function nL(t, e, r) {
  r = r ?? 5;
  let n = t[0], a = t[1];
  if (n > 0 && a > 0 && n / a > 0.5 || n < 0 && a < 0 && a / n > 0.5)
    return Ks().domain([n, a]).ticks(r);
  let o = e * 2, l = e * 5;
  return n < -l && a > l && (r = Math.ceil(r / 2)), [
    ...n < -l ? pc().domain([o, -n]).ticks(r).map((u) => -u) : [],
    0,
    ...a > l ? pc().domain([o, a]).ticks(r) : []
  ].filter((u) => u >= n && u <= a);
}
function iL(t, e) {
  let { min: r, max: n, median: a, count: o, minPositive: l } = t, u = {
    type: "linear",
    domain: [r, n]
  };
  return e == null ? o >= 100 && r >= 0 && a < n * 0.05 && (u.type = r > 0 ? "log" : "symlog") : u.type = e, u.type == "log" && (u.domain[0] = l), u;
}
function aL(t, e = {}) {
  let r = e.fade ?? [], n = e.ordinal ?? !1, a = [], o = (c) => JSON.stringify(c);
  for (let c of t) {
    let f = o(c);
    typeof c == "string" && r.indexOf(c) >= 0 || a.push(f);
  }
  let l = n ? Wk(a.length) : Vs(a.length), u = new Map(a.map((c, f) => [c, l[f]]));
  return {
    domain: t,
    apply: (c) => {
      let f = o(c);
      return u.get(f) ?? "#888888";
    }
  };
}
var oL = /* @__PURE__ */ xt("<g><foreignObject><div> </div></foreignObject></g>");
function Ix(t, e) {
  mt(e, !0);
  let r = /* @__PURE__ */ ie(() => e.dimension == "x" ? {
    px: e.proxy.xScale?.apply(e.label.value) ?? 0,
    py: e.proxy.plotHeight + e.label.padding,
    anchorX: 0.5,
    anchorY: 0
  } : {
    px: -e.label.padding,
    py: e.proxy.yScale?.apply(e.label.value) ?? 0,
    anchorX: 1,
    anchorY: 0.5
  }), n = /* @__PURE__ */ ie(() => v(r).px), a = /* @__PURE__ */ ie(() => v(r).py), o = /* @__PURE__ */ ie(() => v(r).anchorX), l = /* @__PURE__ */ ie(() => v(r).anchorY), u = /* @__PURE__ */ ie(() => e.label.orientation == "vertical" ? {
    rotation: 90,
    shiftX: v(o) * e.label.size.width,
    shiftY: -v(l) * e.label.size.height,
    width: e.label.size.height,
    height: e.label.size.width
  } : {
    rotation: 0,
    shiftX: -v(o) * e.label.size.width,
    shiftY: -v(l) * e.label.size.height,
    width: e.label.size.width,
    height: e.label.size.height
  }), c = /* @__PURE__ */ ie(() => v(u).rotation), f = /* @__PURE__ */ ie(() => v(u).shiftX), h = /* @__PURE__ */ ie(() => v(u).shiftY), d = /* @__PURE__ */ ie(() => v(u).width), g = /* @__PURE__ */ ie(() => v(u).height), m = 4, y = 4;
  var w = oL(), x = ne(w);
  Q(x, "x", -m), Q(x, "y", -y);
  var _ = ne(x);
  let S;
  var k = ne(_, !0);
  ee(_), ee(x), ee(w), Ne(
    (T) => {
      Q(w, "transform", `translate(${v(n) + v(f)}, ${v(a) + v(h)}) rotate(${v(c) ?? ""})`), Q(x, "width", v(d) + m * 2), Q(x, "height", v(g) + y * 2), Q(_, "title", e.label.text), S = nt(_, "", S, T), it(k, e.label.text);
    },
    [
      () => ({
        width: `${v(d) + 2}px`,
        height: `${v(g) + y * 2}px`,
        "line-height": `${v(g) + y * 2}px`,
        "font-family": Gk,
        "font-size": `${dp}px`,
        "margin-left": "4px",
        color: e.color,
        overflow: "hidden",
        "white-space": "nowrap",
        "text-overflow": "ellipsis"
      })
    ]
  ), te(t, w), yt();
}
function Of(t, e = 0) {
  let r = Ak(t);
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
    gridColor: Pi.slate[300],
    labelColor: Pi.slate[400],
    titleColor: Pi.slate[400],
    brushBorder: Pi.slate[500],
    brushBorderBack: "#fff",
    brushFill: "rgba(0,0,0,0.1)"
  },
  dark: {
    scheme: "dark",
    continuousColorScheme: "Inferno",
    continuousColorSchemeAtZero: Hk(0),
    markColor: "#3b82f6",
    markColorFade: "#3b4d7f",
    markColorGray: Of("#3b82f6", -20),
    markColorGrayFade: Of("#1f398a"),
    gridColor: Pi.slate[600],
    labelColor: Pi.slate[500],
    titleColor: Pi.slate[500],
    brushBorder: Pi.slate[400],
    brushBorderBack: "#000",
    brushFill: "rgba(255,255,255,0.1)"
  }
};
var lL = /* @__PURE__ */ xt('<line stroke-linecap="butt"></line>'), sL = /* @__PURE__ */ xt('<line stroke-dasharray="1,3" stroke-linecap="square"></line>'), uL = /* @__PURE__ */ xt("<g><!><!><!></g>"), cL = /* @__PURE__ */ xt('<line stroke-linecap="butt"></line>'), fL = /* @__PURE__ */ xt('<line stroke-linecap="square"></line>'), dL = /* @__PURE__ */ xt("<g><!><!><!></g>"), hL = /* @__PURE__ */ _e("<div><svg><g><!><!><!><!></g></svg></div>");
function gc(t, e) {
  mt(e, !0);
  const [r, n] = Ei(), a = () => On(l, "$darkMode", r), o = 4, l = yr.darkMode;
  let u = tt(e, "xAxis", 19, () => ({})), c = tt(e, "yAxis", 19, () => ({})), f = /* @__PURE__ */ ie(() => e.xScale ? $x(e.xScale, u(), "x") : null), h = /* @__PURE__ */ ie(() => e.yScale ? $x(e.yScale, c(), "y") : null), d = /* @__PURE__ */ ie(() => Gg([
    v(f)?.extents,
    v(h)?.extents,
    e.extents
  ].filter((j) => j != null))), g = /* @__PURE__ */ ie(() => ({
    x: v(d).left,
    y: v(d).top,
    width: e.width - v(d).left - v(d).right,
    height: e.height - v(d).top - v(d).bottom
  })), m = /* @__PURE__ */ ie(() => v(f)?.concrete([0, v(g).width])), y = /* @__PURE__ */ ie(() => v(h)?.concrete([v(g).height, 0])), w = /* @__PURE__ */ ie(() => v(f) && v(m) ? Ux(
    v(f).labels,
    (j) => ({
      center: v(m).apply(j.value),
      length: j.size.width,
      priority: j.level
    }),
    { gap: 4 }
  ) : []), x = /* @__PURE__ */ ie(() => v(h) && v(y) ? Ux(
    v(h).labels,
    (j) => ({
      center: v(y).apply(j.value),
      length: j.size.height,
      priority: j.level
    }),
    { gap: 2 }
  ) : []), _ = /* @__PURE__ */ ie(() => a() ? sn.dark : sn.light), S = /* @__PURE__ */ ie(() => ({
    xScale: v(m),
    yScale: v(y),
    plotWidth: v(g).width,
    plotHeight: v(g).height
  }));
  var k = hL();
  let T;
  var E = ne(k);
  nt(E, "", {}, { position: "absolute", left: "-4px", top: "-4px" });
  var M = ne(E), R = ne(M);
  Vu(R, () => e.childrenBelow ?? Ot, () => v(S));
  var z = oe(R);
  {
    var B = (j) => {
      var W = uL(), Y = ne(W);
      Xt(Y, 17, () => v(f).ticks, or, (K, V) => {
        var U = lL();
        const Z = /* @__PURE__ */ ie(() => v(m).apply(v(V).value));
        Ne(() => {
          Q(U, "x1", v(Z)), Q(U, "y1", v(g).height), Q(U, "x2", v(Z)), Q(U, "y2", v(g).height + (v(V).level == 0 ? 3 : 0)), Q(U, "stroke", v(_).gridColor), Q(U, "stroke-opacity", v(V).level == 0 ? 1 : 0.4);
        }), te(K, U);
      });
      var G = oe(Y);
      Xt(G, 17, () => v(f).gridLines, or, (K, V) => {
        var U = dr();
        const Z = /* @__PURE__ */ ie(() => v(m).apply(v(V).value));
        var le = Ie(U);
        Xt(le, 17, () => v(y)?.rangeBands ?? [], or, (se, ye) => {
          var Se = /* @__PURE__ */ ie(() => My(v(ye), 2));
          let xe = () => v(Se)[0], Ee = () => v(Se)[1];
          var Te = sL();
          Ne(
            (Re, ke) => {
              Q(Te, "x1", v(Z)), Q(Te, "y1", Re), Q(Te, "x2", v(Z)), Q(Te, "y2", ke), Q(Te, "stroke", v(_).gridColor), Q(Te, "stroke-opacity", v(V).level == 0 ? 1 : 0.4);
            },
            [() => Math.min(xe(), Ee()), () => Math.max(xe(), Ee())]
          ), te(se, Te);
        }), te(K, U);
      });
      var X = oe(G);
      Xt(X, 17, () => v(w), or, (K, V) => {
        Ix(K, {
          get label() {
            return v(V);
          },
          dimension: "x",
          get proxy() {
            return v(S);
          },
          get color() {
            return v(_).labelColor;
          }
        });
      }), ee(W), te(j, W);
    };
    Fe(z, (j) => {
      v(f) && v(m) && u() && j(B);
    });
  }
  var $ = oe(z);
  {
    var L = (j) => {
      var W = dL(), Y = ne(W);
      Xt(Y, 17, () => v(h).ticks, or, (K, V) => {
        var U = cL();
        const Z = /* @__PURE__ */ ie(() => v(y).apply(v(V).value));
        Q(U, "x2", 0), Ne(() => {
          Q(U, "x1", -(v(V).level == 0 ? 3 : 0)), Q(U, "y1", v(Z)), Q(U, "y2", v(Z)), Q(U, "stroke", v(_).gridColor), Q(U, "stroke-opacity", v(V).level == 0 ? 1 : 0.4);
        }), te(K, U);
      });
      var G = oe(Y);
      Xt(G, 17, () => v(h).gridLines, or, (K, V) => {
        var U = dr();
        const Z = /* @__PURE__ */ ie(() => v(y).apply(v(V).value));
        var le = Ie(U);
        Xt(le, 17, () => v(m)?.rangeBands ?? [], or, (se, ye) => {
          var Se = /* @__PURE__ */ ie(() => My(v(ye), 2));
          let xe = () => v(Se)[0], Ee = () => v(Se)[1];
          var Te = fL();
          Ne(() => {
            Q(Te, "x1", xe()), Q(Te, "y1", v(Z)), Q(Te, "x2", Ee()), Q(Te, "y2", v(Z)), Q(Te, "stroke", v(_).gridColor), Q(Te, "stroke-opacity", v(V).level == 0 ? 1 : 0.4);
          }), te(se, Te);
        }), te(K, U);
      });
      var X = oe(G);
      Xt(X, 17, () => v(x), or, (K, V) => {
        Ix(K, {
          get label() {
            return v(V);
          },
          dimension: "y",
          get proxy() {
            return v(S);
          },
          get color() {
            return v(_).labelColor;
          }
        });
      }), ee(W), te(j, W);
    };
    Fe($, (j) => {
      v(h) && v(y) && c() && j(L);
    });
  }
  var q = oe($);
  Vu(q, () => e.children ?? Ot, () => v(S)), ee(M), ee(E), ee(k), Ne(
    (j) => {
      T = nt(k, "", T, j), Q(E, "width", e.width + o * 2), Q(E, "height", e.height + o * 2), Q(M, "transform", `translate(${o + v(g).x},${o + v(g).y})`);
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
  ), te(t, k), yt(), n();
}
var vL = /* @__PURE__ */ xt('<rect role="none"></rect><rect role="none"></rect>', 1), pL = /* @__PURE__ */ xt('<rect role="none"></rect><rect role="none"></rect>', 1), gL = /* @__PURE__ */ xt('<rect role="none"></rect><rect role="none"></rect><rect role="none"></rect><rect role="none"></rect>', 1), mL = /* @__PURE__ */ xt('<rect></rect><rect role="none"></rect><!><!><!>', 1), yL = /* @__PURE__ */ xt('<g><rect stroke="none" fill="none" pointer-events="fill" role="none"></rect><!></g>');
function uh(t, e) {
  mt(e, !0);
  const [r, n] = Ei(), a = () => On(l, "$darkMode", r), o = 8, l = yr.darkMode;
  let u = /* @__PURE__ */ ie(() => a() ? sn.dark : sn.light), c, f = /* @__PURE__ */ ie(() => e.proxy.xScale != null && e.value?.x != null ? e.proxy.xScale.applyBand(e.value.x) : [0, e.proxy.plotWidth]), h = /* @__PURE__ */ ie(() => e.proxy.yScale != null && e.value?.y != null ? e.proxy.yScale.applyBand(e.value.y) : [0, e.proxy.plotHeight]);
  function d(E) {
    return E instanceof Array && E.length == 2 && typeof E[0] == "number" && typeof E[1] == "number";
  }
  function g(E, M, R) {
    let z = E.invert(M, R);
    if (E.domain.length == 2 && typeof E.domain[0] == "number" && typeof z == "number") {
      let [B, $] = E.domain;
      return Math.max(Math.min(B, $), Math.min(Math.max(B, $), z));
    }
    return z;
  }
  function m(E, M) {
    return (M == "x" || M == "xy") && E.x == null ? !1 : !((M == "y" || M == "xy") && E.y == null);
  }
  function y() {
    return (E) => {
      E.preventDefault();
      let M = c.getBoundingClientRect().left, R = c.getBoundingClientRect().top, z = E.clientX - M, B = E.clientY - R, $ = e.proxy.xScale ? g(e.proxy.xScale, z) : null, L = e.proxy.yScale ? g(e.proxy.yScale, B) : null;
      if ($ == null && (e.mode == "x" || e.mode == "xy") || L == null && (e.mode == "y" || e.mode == "xy"))
        return;
      let q = (G, X) => typeof G == "number" && typeof X == "number" ? G != X ? [Math.min(G, X), Math.max(G, X)] : null : X, j = (G) => {
        let X = G.clientX - M, K = G.clientY - R, V = e.proxy.xScale ? g(e.proxy.xScale, X, typeof $ == "number" ? "number" : void 0) : null, U = e.proxy.yScale ? g(e.proxy.yScale, K, typeof L == "number" ? "number" : void 0) : null, Z = {};
        return (e.mode == "x" || e.mode == "xy") && (Z.x = q($, V)), (e.mode == "y" || e.mode == "xy") && (Z.y = q(L, U)), m(Z, e.mode) ? Z : null;
      }, W = (G) => {
        G.preventDefault(), e.onChange(j(G));
      }, Y = (G) => {
        e.onChange(j(G)), window.removeEventListener("mousemove", W), window.removeEventListener("mouseup", Y);
      };
      window.addEventListener("mousemove", W), window.addEventListener("mouseup", Y);
    };
  }
  function w(E) {
    return (M) => {
      if (e.value == null)
        return;
      let R = { ...e.value };
      M.preventDefault();
      let { xScale: z, yScale: B } = e.proxy, $ = d(R.x), L = d(R.y), q = [
        ...z && R.x ? z.applyBand(R.x) : [0, 0],
        ...B && R.y ? B.applyBand(R.y) : [0, 0]
      ];
      if (!$) {
        let G = Math.max(E[0], E[1]);
        E = [G, G, E[2], E[3]];
      }
      if (!L) {
        let G = Math.max(E[2], E[3]);
        E = [E[0], E[1], G, G];
      }
      let j = (G) => {
        let X = G.pageX - M.pageX, K = G.pageY - M.pageY, V = [X, X, K, K].map((Z, le) => q[le] + Z * E[le]), U = { ...R };
        if (z && (e.mode == "x" || e.mode == "xy"))
          if ($) {
            let Z = g(z, V[0], "number"), le = g(z, V[1], "number");
            U.x = Z == le ? null : Z < le ? [Z, le] : [le, Z];
          } else
            U.x = g(z, (V[0] + V[1]) / 2), typeof U.x != "string" && (U.x = null);
        if (B != null && (e.mode == "y" || e.mode == "xy"))
          if (L) {
            let Z = g(B, V[2], "number"), le = g(B, V[3], "number");
            U.y = Z == le ? null : Z < le ? [Z, le] : [le, Z];
          } else
            U.y = g(B, (V[2] + V[3]) / 2), typeof U.y != "string" && (U.y = null);
        return m(U, e.mode) || (U = null), U;
      }, W = (G) => {
        G.preventDefault(), e.onChange(j(G));
      }, Y = (G) => {
        let X = j(G);
        X && !$ && !L && X.x == R.x && X.y == R.y && (X = null), e.onChange(X), window.removeEventListener("mousemove", W), window.removeEventListener("mouseup", Y);
      };
      window.addEventListener("mousemove", W), window.addEventListener("mouseup", Y);
    };
  }
  var x = yL(), _ = ne(x);
  Q(_, "x", 0), Q(_, "y", 0);
  var S = /* @__PURE__ */ ie(y);
  _.__mousedown = function(...E) {
    v(S)?.apply(this, E);
  }, nt(_, "", {}, { cursor: "crosshair" }), Ii(_, (E) => c = E, () => c);
  var k = oe(_);
  {
    var T = (E) => {
      var M = mL(), R = Ie(M);
      let z;
      var B = oe(R), $ = /* @__PURE__ */ ie(() => w([1, 1, 1, 1]));
      B.__mousedown = function(...K) {
        v($)?.apply(this, K);
      };
      let L;
      var q = oe(B);
      {
        var j = (K) => {
          var V = vL(), U = Ie(V);
          Q(U, "width", o);
          var Z = /* @__PURE__ */ ie(() => w([1, 0, 0, 0]));
          U.__mousedown = function(...ye) {
            v(Z)?.apply(this, ye);
          }, nt(U, "", {}, {
            cursor: "ew-resize",
            stroke: "none",
            fill: "none",
            "pointer-events": "all"
          });
          var le = oe(U);
          Q(le, "width", o);
          var se = /* @__PURE__ */ ie(() => w([0, 1, 0, 0]));
          le.__mousedown = function(...ye) {
            v(se)?.apply(this, ye);
          }, nt(le, "", {}, {
            cursor: "ew-resize",
            stroke: "none",
            fill: "none",
            "pointer-events": "all"
          }), Ne(
            (ye, Se, xe, Ee) => {
              Q(U, "x", v(f)[0] - o / 2), Q(U, "y", ye), Q(U, "height", Se), Q(le, "x", v(f)[1] - o / 2), Q(le, "y", xe), Q(le, "height", Ee);
            },
            [
              () => Math.min(v(h)[0], v(h)[1]),
              () => Math.abs(v(h)[0] - v(h)[1]),
              () => Math.min(v(h)[0], v(h)[1]),
              () => Math.abs(v(h)[0] - v(h)[1])
            ]
          ), te(K, V);
        };
        Fe(q, (K) => {
          (e.mode == "x" || e.mode == "xy") && d(e.value.x) && K(j);
        });
      }
      var W = oe(q);
      {
        var Y = (K) => {
          var V = pL(), U = Ie(V);
          Q(U, "height", o);
          var Z = /* @__PURE__ */ ie(() => w([0, 0, 1, 0]));
          U.__mousedown = function(...ye) {
            v(Z)?.apply(this, ye);
          }, nt(U, "", {}, {
            cursor: "ns-resize",
            stroke: "none",
            fill: "none",
            "pointer-events": "all"
          });
          var le = oe(U);
          Q(le, "height", o);
          var se = /* @__PURE__ */ ie(() => w([0, 0, 0, 1]));
          le.__mousedown = function(...ye) {
            v(se)?.apply(this, ye);
          }, nt(le, "", {}, {
            cursor: "ns-resize",
            stroke: "none",
            fill: "none",
            "pointer-events": "all"
          }), Ne(
            (ye, Se, xe, Ee) => {
              Q(U, "x", ye), Q(U, "width", Se), Q(U, "y", v(h)[0] - o / 2), Q(le, "x", xe), Q(le, "width", Ee), Q(le, "y", v(h)[1] - o / 2);
            },
            [
              () => Math.min(v(f)[0], v(f)[1]),
              () => Math.abs(v(f)[0] - v(f)[1]),
              () => Math.min(v(f)[0], v(f)[1]),
              () => Math.abs(v(f)[0] - v(f)[1])
            ]
          ), te(K, V);
        };
        Fe(W, (K) => {
          (e.mode == "y" || e.mode == "xy") && d(e.value.y) && K(Y);
        });
      }
      var G = oe(W);
      {
        var X = (K) => {
          var V = gL(), U = Ie(V);
          Q(U, "width", o), Q(U, "height", o);
          var Z = /* @__PURE__ */ ie(() => w([1, 0, 1, 0]));
          U.__mousedown = function(...Te) {
            v(Z)?.apply(this, Te);
          }, nt(U, "", {}, {
            cursor: "nesw-resize",
            stroke: "none",
            fill: "none",
            "pointer-events": "all"
          });
          var le = oe(U);
          Q(le, "width", o), Q(le, "height", o);
          var se = /* @__PURE__ */ ie(() => w([1, 0, 0, 1]));
          le.__mousedown = function(...Te) {
            v(se)?.apply(this, Te);
          }, nt(le, "", {}, {
            cursor: "nwse-resize",
            stroke: "none",
            fill: "none",
            "pointer-events": "all"
          });
          var ye = oe(le);
          Q(ye, "width", o), Q(ye, "height", o);
          var Se = /* @__PURE__ */ ie(() => w([0, 1, 1, 0]));
          ye.__mousedown = function(...Te) {
            v(Se)?.apply(this, Te);
          }, nt(ye, "", {}, {
            cursor: "nwse-resize",
            stroke: "none",
            fill: "none",
            "pointer-events": "all"
          });
          var xe = oe(ye);
          Q(xe, "width", o), Q(xe, "height", o);
          var Ee = /* @__PURE__ */ ie(() => w([0, 1, 0, 1]));
          xe.__mousedown = function(...Te) {
            v(Ee)?.apply(this, Te);
          }, nt(xe, "", {}, {
            cursor: "nesw-resize",
            stroke: "none",
            fill: "none",
            "pointer-events": "all"
          }), Ne(() => {
            Q(U, "x", v(f)[0] - o / 2), Q(U, "y", v(h)[0] - o / 2), Q(le, "x", v(f)[0] - o / 2), Q(le, "y", v(h)[1] - o / 2), Q(ye, "x", v(f)[1] - o / 2), Q(ye, "y", v(h)[0] - o / 2), Q(xe, "x", v(f)[1] - o / 2), Q(xe, "y", v(h)[1] - o / 2);
          }), te(K, V);
        };
        Fe(G, (K) => {
          e.mode == "xy" && d(e.value.x) && d(e.value.y) && K(X);
        });
      }
      Ne(
        (K, V, U, Z, le, se, ye, Se, xe, Ee) => {
          Q(R, "x", K), Q(R, "width", V), Q(R, "y", U), Q(R, "height", Z), z = nt(R, "", z, le), Q(B, "x", se), Q(B, "width", ye), Q(B, "y", Se), Q(B, "height", xe), L = nt(B, "", L, Ee);
        },
        [
          () => Math.min(v(f)[0], v(f)[1]),
          () => Math.abs(v(f)[0] - v(f)[1]),
          () => Math.min(v(h)[0], v(h)[1]),
          () => Math.abs(v(h)[0] - v(h)[1]),
          () => ({
            stroke: v(u).brushBorderBack,
            fill: "none",
            "stroke-width": 2
          }),
          () => Math.min(v(f)[0], v(f)[1]),
          () => Math.abs(v(f)[0] - v(f)[1]),
          () => Math.min(v(h)[0], v(h)[1]),
          () => Math.abs(v(h)[0] - v(h)[1]),
          () => ({
            stroke: v(u).brushBorder,
            fill: v(u).brushFill,
            cursor: "move"
          })
        ]
      ), te(E, M);
    };
    Fe(k, (E) => {
      v(f) && v(h) && e.value && E(T);
    });
  }
  ee(x), Ne(() => {
    Q(_, "width", e.proxy.plotWidth), Q(_, "height", e.proxy.plotHeight);
  }), te(t, x), yt(), n();
}
Nr(["mousedown"]);
var bL = /* @__PURE__ */ _e("<option> </option>"), xL = /* @__PURE__ */ _e('<select class="form-select text-center pl-[4px] pr-[16px] py-0 my-0 border-0 rounded text-sm! text-slate-500 bg-white/90 dark:text-slate-400 dark:bg-black/25"></select>');
function ch(t, e) {
  mt(e, !0);
  let r;
  const n = jg(), a = n + "_null", o = n + "_undefined", l = (g) => g === null ? a : g === void 0 ? o : g.toString(), u = (g) => g === a ? null : g === o ? void 0 : g, c = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 20">
    <path d="M 2,8 L 5,12 L 8,8" style="stroke:${Pi.gray[500]};stroke-opacity:0.7;stroke-width:1.5;fill:none;stroke-linecap:round;stroke-linejoin:round" />
  </svg>`;
  var f = xL();
  f.__change = () => {
    e.onChange(u(r.value));
  };
  let h;
  Xt(f, 21, () => e.options, or, (g, m) => {
    var y = bL(), w = ne(y, !0);
    ee(y);
    var x = {};
    Ne(
      (_) => {
        it(w, v(m).label), x !== (x = _) && (y.value = (y.__value = _) ?? "");
      },
      [() => l(v(m).value)]
    ), te(g, y);
  }), ee(f), Ii(f, (g) => r = g, () => r);
  var d;
  ed(f), Ne(
    (g, m) => {
      h = nt(f, "", h, g), d !== (d = m) && (f.value = (f.__value = m) ?? "", Bs(f, m));
    },
    [
      () => ({
        "background-image": `url(data:image/svg+xml;base64,${btoa(c) ?? ""})`,
        "background-position": "right center"
      }),
      () => l(e.value)
    ]
  ), te(t, f), yt();
}
Nr(["change"]);
var wL = /* @__PURE__ */ _e('<span class="flex gap-1 select-none"><span class="text-slate-400 dark:text-slate-500 text-sm"> </span> <!></span>');
function Is(t, e) {
  mt(e, !0);
  let r = tt(e, "value", 15);
  const n = ["linear", "log", "symlog"];
  var a = dr(), o = Ie(a);
  {
    var l = (u) => {
      var c = wL(), f = ne(c), h = ne(f);
      ee(f);
      var d = oe(f, 2);
      {
        let g = /* @__PURE__ */ ie(() => n.map((m) => ({ value: m, label: m })));
        ch(d, {
          get options() {
            return v(g);
          },
          get value() {
            return r();
          },
          onChange: (m) => r(m)
        });
      }
      ee(c), Ne(() => it(h, `${e.label ?? ""}:`)), te(u, c);
    };
    Fe(o, (u) => {
      r() != null && r() != "band" && u(l);
    });
  }
  te(t, a), yt();
}
const Ru = {
  linear: { type: "linear", expr: (t) => t, forward: (t) => t, reverse: (t) => t },
  log: {
    type: "log",
    expr: (t) => N.cond(N.gt(t, 0), N.log(t), N.literal("nan")),
    forward: (t) => Math.log10(t),
    reverse: (t) => Math.pow(10, t)
  },
  symlog: {
    type: "symlog",
    expr: (t, e) => N.mul(N.sign(t), N.ln(N.add(1, N.abs(N.div(t, e))))),
    forward: (t, e) => Math.sign(t) * Math.log1p(Math.abs(t) / e),
    reverse: (t, e) => Math.sign(t) * Math.expm1(Math.abs(t)) * e
  }
};
function _L(t, e) {
  let r = t, n = 1 / 0;
  for (let a of e) {
    let o = Math.abs(t - a);
    o < n && (n = o, r = a);
  }
  return r;
}
function Xk(t, e = {}) {
  let { min: r, max: n, median: a, count: o } = t, l = e.scale;
  l == "band" && (l = null), l == null && (l = "linear", o >= 100 && r >= 0 && a < n * 0.05 && (l = r > 0 ? "log" : "symlog")), r <= 0 && l == "log" && (n <= 0 ? (r = 1, n = 10) : r = Math.min(t.minPositive, n / 10));
  let u = e.desiredCount ?? 5;
  switch (l) {
    case "linear": {
      let c = Ks().domain([r, n]).nice(u), f = c.ticks(u);
      return {
        scale: { ...Ru.linear, domain: c.domain() },
        binStart: c.domain()[0],
        binSize: f[1] - f[0]
      };
    }
    case "log": {
      let c = pc().domain([r, n]).nice(), f = Math.log10(c.domain()[0]), h = (Math.log10(c.domain()[1]) - f) / u;
      return h = _L(h, [0.05, 0.1, 0.2, 0.5, 1, 1.5, 2]), {
        scale: { ...Ru.log, domain: c.domain() },
        binStart: f,
        binSize: h
      };
    }
    case "symlog": {
      let c = Math.max(Math.abs(r), Math.abs(n)), f = c >= 100 ? 1 : c > 0 ? c / 1e5 : 1, h = Ru.symlog.forward(r, f), d = Ru.symlog.forward(n, f);
      return {
        scale: { ...Ru.symlog, domain: [r, n], constant: f },
        binStart: h,
        binSize: (d - h) / u
      };
    }
    default:
      throw new Error("invalid scale type");
  }
}
function Jo() {
  return jg(14);
}
function Yk(t) {
  return {
    component: "Histogram",
    props: { field: t.name, binCount: 20 }
  };
}
function Gf(t) {
  return t.type == "discrete[]" ? {
    component: "ListCountPlot",
    props: { field: t.name }
  } : {
    component: "CountPlot",
    props: { field: t.name }
  };
}
function kL(t, e) {
  return {
    component: "HistogramStack",
    props: { xField: t.name, groupField: e.name, xBinCount: 20, groupBinCount: 5 }
  };
}
function SL(t, e) {
  return {
    component: "Histogram2D",
    props: { xField: t.name, yField: e.name, xBinCount: 20, yBinCount: 20 }
  };
}
function CL(t, e) {
  return {
    component: "BoxPlot",
    props: { xField: t.name, yField: e.name, xBinCount: 20 }
  };
}
class Zk {
  table;
  coordinator;
  constructor(e, r) {
    this.table = r, this.coordinator = e;
  }
  async exec(e) {
    await this.coordinator.exec(e);
  }
  async query(e) {
    return (await this.coordinator.query(e)).toArray().map((n) => ({ ...n }));
  }
  async queryOne(e) {
    return { ...(await this.coordinator.query(e)).get(0) };
  }
  async describe() {
    return await this.query(N.sql`DESCRIBE ${this.table}`);
  }
  async distinctCount(e) {
    return (await this.queryOne(N.sql`SELECT COUNT(DISTINCT ${N.column(e)}) AS count FROM ${this.table}`)).count;
  }
  async columnDescriptions() {
    let e = await this.describe(), r = [];
    for (let n of e)
      r.push({
        name: n.column_name,
        type: n.column_type,
        jsType: Kk(n.column_type),
        distinctCount: await this.distinctCount(n.column_name)
      });
    return r;
  }
  async defaultViewportScale(e, r) {
    let { stdX: n, stdY: a } = await this.queryOne(
      N.Query.from(this.table).select({
        stdX: N.sql`STDDEV(${N.column(e)})::FLOAT`,
        stdY: N.sql`STDDEV(${N.column(r)})::FLOAT`
      })
    );
    return 1 / (Math.max(n, a, 1e-3) * 3);
  }
  defaultPlots(e) {
    let r = [
      { id: Jo(), title: "Named Selections", spec: { component: "SelectionList", props: {} } }
    ];
    for (let n of e)
      if (n.jsType != null && !(n.distinctCount <= 1))
        switch (n.jsType) {
          case "string":
            n.distinctCount <= 1e3 && r.push({
              id: Jo(),
              title: n.name,
              spec: Gf({ name: n.name, type: "discrete" })
            });
            break;
          case "string[]":
            r.push({
              id: Jo(),
              title: n.name,
              spec: Gf({ name: n.name, type: "discrete[]" })
            });
            break;
          case "number":
            n.distinctCount <= 10 ? r.push({
              id: Jo(),
              title: n.name,
              spec: Gf({ name: n.name, type: "discrete" })
            }) : r.push({
              id: Jo(),
              title: n.name,
              spec: Yk({ name: n.name })
            });
            break;
        }
    return r;
  }
  async makeCategoryColumn(e, r) {
    let n = `_ev_${e}_id`, a = Array.from(
      await this.query(
        N.Query.from(this.table).select({ value: N.cast(N.column(e), "TEXT"), count: N.count() }).where(N.not(N.isNull(N.cast(N.column(e), "TEXT")))).groupby(N.cast(N.column(e), "TEXT")).orderby(N.desc(N.count())).limit(r)
      )
    ), o = a.length, l = a.length + 1;
    await this.exec(N.sql`
      ALTER TABLE ${this.table} ADD COLUMN IF NOT EXISTS ${N.column(n)} INTEGER DEFAULT 0;
      UPDATE ${this.table}
      SET ${N.column(n)} = CASE ${N.column(e)}::TEXT
        ${a.map(({ value: m }, y) => N.sql`WHEN ${N.literal(m)} THEN ${N.literal(y)}`).join(" ")}
      ELSE (CASE WHEN ${N.column(e)} IS NULL THEN ${N.literal(l)} ELSE ${N.literal(o)} END) END
    `);
    let u = await this.query(N.sql`
      SELECT ${N.column(n)} AS index, COUNT(*)::INT AS count
      FROM ${this.table}
      GROUP BY ${N.column(n)}
    `), c = /* @__PURE__ */ new Map();
    for (let m of u)
      c.set(m.index, m.count);
    let f = c.get(o) ?? 0, h = c.get(l) ?? 0, d = Vs(a.length), g = a.map(({ value: m }, y) => ({
      label: m,
      color: d[y],
      predicate: N.eq(N.cast(N.column(e), "TEXT"), N.literal(m)),
      count: c.get(y) ?? 0
    }));
    if (f > 0) {
      let { otherCategoryCount: m } = await this.queryOne(N.sql`
        SELECT COUNT(DISTINCT(${N.column(e)}::TEXT)) AS otherCategoryCount
        FROM ${this.table}
        WHERE ${N.column(n)} = ${N.literal(o)} AND ${N.column(e)} IS NOT NULL
      `);
      g.push({
        label: `(other ${m.toLocaleString()})`,
        color: "#9eabc2",
        predicate: a.length > 0 ? N.sql`${N.column(e)} IS NOT NULL AND ${N.column(e)}::TEXT NOT IN (${a.map((y) => N.literal(y.value)).join(",")})` : N.sql`${N.column(e)} IS NOT NULL`,
        count: f
      });
    }
    return h > 0 && (f <= 0 && (await this.exec(`
          UPDATE ${this.table}
          SET ${N.column(n)} = ${N.column(n)} - 1 WHERE ${N.column(n)} = ${N.literal(l)}
        `), l -= 1), g.push({
      label: "(null)",
      color: "#aaaaaa",
      predicate: N.isNull(N.column(e)),
      count: h
    })), {
      indexColumn: n,
      legend: g
    };
  }
  async makeBinnedNumericColumn(e) {
    let r = await this.queryOne(
      N.Query.from(this.table).select({
        count: N.count(),
        min: N.min(N.column(e)),
        max: N.max(N.column(e)),
        mean: N.avg(N.column(e)),
        median: N.median(N.column(e))
      }).where(N.isFinite(N.column(e)))
    ), n = Xk(r), a = `_ev_${e}_id`, o = N.cast(N.column(e), "DOUBLE");
    o = n.scale.expr(o, n.scale.constant ?? 0);
    let l = N.cond(
      N.isFinite(N.cast(N.column(e), "DOUBLE")),
      N.floor(N.mul(N.sub(o, n.binStart), 1 / n.binSize)),
      N.literal(null)
    );
    await this.exec(N.sql`
      ALTER TABLE ${this.table} ADD COLUMN IF NOT EXISTS ${N.column(a)} INTEGER DEFAULT 0;
      UPDATE ${this.table}
      SET ${N.column(a)} = ${l}
    `);
    let u = await this.query(N.sql`
      SELECT ${N.column(a)} AS index, COUNT(*)::INT AS count
      FROM ${this.table}
      GROUP BY ${N.column(a)}
      ORDER BY ${N.column(a)} ASC
    `), c = null, f = null, h = /* @__PURE__ */ new Map(), d = (y) => n.scale.reverse(y, n.scale.constant ?? 0);
    for (let { index: y, count: w } of Array.from(u))
      y != null && ((c == null || y < c) && (c = y), (f == null || y > f) && (f = y)), h.set(y, w);
    let g = [], m = Xa(".6");
    if (c != null && f != null) {
      let y = Wk(f - c + 1);
      for (let w = c; w <= f; w++) {
        let x = d(w * n.binSize + n.binStart), _ = d((w + 1) * n.binSize + n.binStart);
        g.push({
          label: `[${m(x)}, ${m(_)})`,
          color: y[w - c],
          predicate: N.eq(l, N.literal(w)),
          count: h.get(w) ?? 0
        });
      }
    }
    if (h.has(null)) {
      let y = g.length;
      await this.exec(`
        UPDATE ${this.table}
        SET ${N.column(a)} = ${N.literal(y)}
        WHERE ${N.column(a)} IS NULL
      `), g.push({
        label: "(null / nan / inf)",
        color: "#aaaaaa",
        predicate: N.isNull(l),
        count: h.get(null) ?? 0
      });
    }
    return {
      indexColumn: a,
      legend: g
    };
  }
}
function Kk(t) {
  return EL.has(t) ? "number" : ML.has(t) ? "string" : t.match(/^(VARCHAR|TEXT)\[\d*\]$/) ? "string[]" : null;
}
const EL = /* @__PURE__ */ new Set([
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
]), ML = /* @__PURE__ */ new Set(["BOOLEAN", "DATE", "VARCHAR", "CHAR", "BPCHAR", "TEXT", "STRING"]);
async function Ro(t, e, r) {
  let a = (await t.query(
    N.Query.describe(N.Query.from(e).select({ field: N.column(r, e) }))
  )).get(0)?.column_type;
  if (a == null)
    return null;
  let o = Kk(a);
  if (o == "number") {
    let l = N.cast(N.column(r, e), "DOUBLE"), u = await t.query(
      N.Query.from(e).select({
        count: N.count(),
        min: N.min(l),
        minPositive: N.min(N.cond(N.gt(l, 0), l, N.literal(null))),
        max: N.max(l),
        mean: N.avg(l),
        median: N.median(l)
      }).where(N.isFinite(l))
    ), c = await t.query(
      N.Query.from(e).select({
        countNonFinite: N.count()
      }).where(N.or(N.not(N.isFinite(l)), N.isNull(l)))
    );
    return {
      table: e,
      field: r,
      quantitative: { ...u.get(0), ...c.get(0) }
    };
  } else if (o == "string") {
    let l = N.cast(N.column(r, e), "TEXT"), u = Array.from(
      await t.query(
        N.Query.from(e).select({ value: l, count: N.count() }).where(N.isNotNull(l)).groupby(l).orderby(N.desc(N.count())).limit(1e3)
      )
    ), c = (await t.query(N.Query.from(e).select({ count: N.count() }).where(N.isNull(l)))).get(0).count, { otherCount: f, numOtherLevels: h } = (await t.query(
      N.Query.from(e).select({ otherCount: N.count(), numOtherLevels: N.sql`COUNT(DISTINCT(${l}))` }).where(
        N.isNotNull(l),
        N.not(
          N.isIn(
            l,
            u.map((d) => N.literal(d.value))
          )
        )
      )
    )).get(0);
    return {
      table: e,
      field: r,
      nominal: {
        levels: u,
        numOtherLevels: h,
        otherCount: f,
        nullCount: c
      }
    };
  }
  return null;
}
function Nc(...t) {
  let e = {}, r = {}, n = {}, a = {}, o = {};
  for (let c of t) {
    if (c.stats.quantitative) {
      let f = Xk(c.stats.quantitative, {
        scale: c.scaleType,
        desiredCount: c.binCount ?? 20
      }), h = N.cast(N.column(c.stats.field), "DOUBLE"), d = f.scale.expr(h, f.scale.constant ?? 0);
      e[c.key] = f.scale.type == "log" ? N.cond(
        N.and(N.isFinite(h), N.gt(h, N.literal(0))),
        N.floor(N.mul(N.sub(d, f.binStart), 1 / f.binSize)),
        N.literal(null)
      ) : N.cond(
        N.isFinite(h),
        N.floor(N.mul(N.sub(d, f.binStart), 1 / f.binSize)),
        N.literal(null)
      );
      let g = (k) => Math.floor((f.scale.forward(k, f.scale.constant ?? 0) - f.binStart) / f.binSize), m = (k) => f.scale.reverse(k * f.binSize + f.binStart, f.scale.constant ?? 0);
      n[c.key] = (k) => k == null ? "n/a" : [m(k), m(k + 1)];
      let y = g(
        f.scale.type == "log" ? c.stats.quantitative.minPositive : c.stats.quantitative.min
      ), w = g(c.stats.quantitative.max), x = [m(y), m(w + 1)], _ = c.stats.quantitative.countNonFinite > 0;
      f.scale.type == "log" && c.stats.quantitative.min < 0 && (_ = !0), r[c.key] = {
        type: f.scale.type,
        constant: f.scale.constant,
        domain: x,
        specialValues: _ ? ["n/a"] : []
      };
      let S = (k) => {
        if (typeof k == "string") {
          if (k == "n/a")
            return N.or(N.not(N.isFinite(h)), N.isNull(h));
        } else if (k instanceof Array)
          if (k.length == 2 && typeof k[0] == "number") {
            let [T, E] = k;
            if (typeof T == "number" && typeof E == "number")
              return N.isBetween(h, [Math.min(T, E), Math.max(T, E)]);
          } else
            return N.or(...k.map(S));
        return N.literal(!1);
      };
      a[c.key] = S, o[c.key] = (k, T) => {
        let E = typeof k == "string" ? [1, 0] : [0, k[0]], M = typeof T == "string" ? [1, 0] : [0, T[0]];
        return E[0] != M[0] ? E[0] - M[0] : E[1] - M[1];
      };
    }
    if (c.stats.nominal) {
      let f = c.binCount ?? 15, { levels: h, nullCount: d, otherCount: g, numOtherLevels: m } = c.stats.nominal;
      h.length > f && (m += h.length - f, g = h.slice(f).reduce((T, E) => T + E.count, 0), h = h.slice(0, f));
      let y = `(${m.toLocaleString()} others)`, w = "(null)", x = N.cast(N.column(c.stats.field), "TEXT");
      e[c.key] = N.cond(
        N.isIn(
          x,
          h.map((T) => N.literal(T.value))
        ),
        x,
        N.cond(N.isNull(x), N.literal(w), N.literal(y))
      );
      let _ = [...g > 0 ? [y] : [], ...d > 0 ? [w] : []];
      r[c.key] = {
        type: "band",
        domain: h.map((T) => T.value),
        specialValues: _
      }, n[c.key] = (T) => T;
      let S = (T) => T == w ? N.isNull(x) : T == y ? N.and(
        N.not(
          N.isIn(
            x,
            h.map((E) => N.literal(E.value))
          )
        ),
        N.isNotNull(x)
      ) : N.isNotDistinct(x, N.literal(T));
      a[c.key] = (T) => T instanceof Array ? N.or(...T.map((E) => S(E))) : typeof T == "string" ? S(T) : null;
      let k = h.map((T) => T.value);
      o[c.key] = (T, E) => {
        if (typeof T == "string" && typeof E == "string") {
          let M = k.indexOf(T);
          M < 0 && (M = k.length + _.indexOf(T));
          let R = k.indexOf(E);
          return R < 0 && (R = k.length + _.indexOf(E)), M - R;
        }
        return 0;
      };
    }
  }
  function l(c) {
    let f = { ...c };
    for (let h of t)
      f[h.key] = n[h.key](f[h.key]);
    return f;
  }
  function u(c) {
    let f = [];
    for (let h of t) {
      let d = c[h.key], g = d != null ? a[h.key](d) : null;
      g && f.push(g);
    }
    return {
      value: { ...c },
      predicate: f.length > 0 ? N.and(...f) : null
    };
  }
  return { select: e, collect: l, scales: r, clause: u, order: o };
}
function Ul(t) {
  let e = t.coordinator, r = new RL({ ...t, coordinator: e });
  return e.connect(r), r.destroy = () => {
    e.disconnect(r);
  }, r;
}
class RL extends Fd {
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
function Il(t, e, r) {
  let n = t;
  if (n == null)
    return;
  let a = n.subscribe((o) => {
    o != null && r(o);
  });
  return et(() => {
    n.set(e());
  }), a;
}
var TL = /* @__PURE__ */ xt('<line></line><line></line><line></line><rect></rect><line stroke-linecap="butt"></line>', 1), NL = /* @__PURE__ */ xt("<!><!>", 1), FL = /* @__PURE__ */ _e('<div class="text-slate-400 mb-1 select-none"> </div> <div><!></div> <div class="text-slate-400 mb-1 select-none text-right"> </div> <div class="flex flex-col items-end gap-1"><div class="flex flex gap-2 mt-2"><!> <!></div></div>', 1);
function PL(t, e) {
  mt(e, !0);
  const [r, n] = Ei(), a = () => On(u, "$darkMode", r);
  let o = tt(e, "xBinCount", 3, 20);
  const l = yr.coordinator, u = yr.darkMode;
  let c = /* @__PURE__ */ ie(() => a() ? sn.dark : sn.light), f = /* @__PURE__ */ me(null), h = /* @__PURE__ */ me(null), d = /* @__PURE__ */ me(null), g = /* @__PURE__ */ me(null);
  function m(B, $, L, q, j) {
    let W = /* @__PURE__ */ me(null);
    Promise.all([
      Ro(B, $, L),
      Ro(B, $, q)
    ]).then(([K, V]) => {
      H(W, K != null && V != null ? { x: K, y: V } : null);
    });
    let Y = /* @__PURE__ */ ie(() => v(W) ? Nc({
      key: "x",
      stats: v(W).x,
      scaleType: v(f),
      binCount: o()
    }) : null), G = /* @__PURE__ */ ie(() => v(W)?.y.quantitative ? iL(v(W).y.quantitative, v(h)) : null);
    et(() => {
      v(f) == null && H(f, v(Y)?.scales.x?.type ?? null), v(h) == null && H(h, v(G)?.type ?? null);
    });
    function X(K, V, U) {
      return Ul({
        coordinator: B,
        selection: V,
        query: (Z) => {
          let le = N.column(q, $);
          return N.Query.from($).select({
            ...K.select,
            min: N.min(le),
            max: N.max(le),
            p50: N.median(le),
            p25: N.quantile(le, 0.25),
            p75: N.quantile(le, 0.75)
          }).where(Z, N.isFinite(le)).groupby(K.select.x);
        },
        queryResult: (Z) => {
          U(Array.from(Z).map(K.collect));
        }
      });
    }
    et(() => {
      if (v(Y) == null || v(G) == null)
        return;
      let K = v(Y), V = /* @__PURE__ */ me(gi([])), U = X(K, j, (Z) => {
        H(V, Z, !0);
      });
      return U.reset = () => {
        H(d, null);
      }, et(() => {
        H(g, {
          xScale: K.scales.x,
          yScale: v(G),
          items: v(V)
        });
      }), et(() => {
        let Z = {
          source: U,
          clients: /* @__PURE__ */ new Set([U]),
          ...v(d) != null ? K.clause(v(d)) : { value: null, predicate: null }
        };
        j.update(Z), j.activate(Z);
      }), () => {
        U.destroy(), j.update({
          source: U,
          clients: /* @__PURE__ */ new Set([U]),
          value: null,
          predicate: null
        });
      };
    });
  }
  et(() => {
    m(l, e.table, e.xField, e.yField, e.filter);
  }), et(() => Il(
    e.stateStore,
    () => ({
      brush: v(d),
      xScaleType: v(f),
      yScaleType: v(h)
    }),
    (B) => {
      H(d, B.brush), H(f, B.xScaleType), H(h, B.yScaleType);
    }
  ));
  var y = FL(), w = Ie(y), x = ne(w);
  ee(w);
  var _ = oe(w, 2);
  nt(_, "", {}, { height: "250px" });
  var S = ne(_);
  oh(S, { children: ($, L = Ot, q = Ot) => {
    var j = dr(), W = Ie(j);
    {
      var Y = (G) => {
        gc(G, {
          get width() {
            return L();
          },
          get height() {
            return q();
          },
          get xScale() {
            return v(g).xScale;
          },
          get yScale() {
            return v(g).yScale;
          },
          children: (K, V = Ot) => {
            var U = NL();
            const Z = /* @__PURE__ */ ie(() => V().xScale), le = /* @__PURE__ */ ie(() => V().yScale), se = /* @__PURE__ */ ie(() => a() ? "#bbbbbb" : "black");
            var ye = Ie(U);
            Xt(ye, 17, () => v(g)?.items ?? [], or, (xe, Ee) => {
              var Te = TL();
              const Re = /* @__PURE__ */ ie(() => {
                const [He, We] = v(Z).applyBand(v(Ee).x);
                return { x0: He, x1: We };
              }), ke = /* @__PURE__ */ ie(() => v(le).apply(v(Ee).p50)), ge = /* @__PURE__ */ ie(() => {
                const [He, We] = v(le).applyBand([v(Ee).min, v(Ee).max]);
                return { ey0: He, ey1: We };
              }), we = /* @__PURE__ */ ie(() => {
                const [He, We] = v(le).applyBand([v(Ee).p25, v(Ee).p75]);
                return { by0: He, by1: We };
              }), $e = /* @__PURE__ */ ie(() => Math.min(Math.abs(v(Re).x1 - v(Re).x0) * 0.1, 1)), qe = /* @__PURE__ */ ie(() => Math.abs(v(Re).x1 - v(Re).x0) / 3);
              var Ve = Ie(Te), rt = oe(Ve), dt = oe(rt), ot = oe(dt), wt = oe(ot);
              Ne(
                (He, We, Mt, Ze, Ut, _t) => {
                  Q(Ve, "y1", v(ge).ey0), Q(Ve, "y2", v(ge).ey1), Q(Ve, "x1", (v(Re).x0 + v(Re).x1) / 2), Q(Ve, "x2", (v(Re).x0 + v(Re).x1) / 2), Q(Ve, "stroke", v(se)), Q(rt, "y1", v(ge).ey0), Q(rt, "y2", v(ge).ey0), Q(rt, "x1", (v(Re).x0 + v(Re).x1) / 2 - v(qe) / 2), Q(rt, "x2", (v(Re).x0 + v(Re).x1) / 2 + v(qe) / 2), Q(rt, "stroke", v(se)), Q(dt, "y1", v(ge).ey1), Q(dt, "y2", v(ge).ey1), Q(dt, "x1", (v(Re).x0 + v(Re).x1) / 2 - v(qe) / 2), Q(dt, "x2", (v(Re).x0 + v(Re).x1) / 2 + v(qe) / 2), Q(dt, "stroke", v(se)), Q(ot, "x", He), Q(ot, "height", We), Q(ot, "y", Mt), Q(ot, "width", Ze), Q(ot, "fill", v(c).markColor), Q(wt, "y1", v(ke)), Q(wt, "y2", v(ke)), Q(wt, "x1", Ut), Q(wt, "x2", _t), Q(wt, "stroke", v(se));
                },
                [
                  () => Math.min(v(Re).x0, v(Re).x1) + v($e) / 2,
                  () => Math.abs(v(we).by0 - v(we).by1),
                  () => Math.min(v(we).by0, v(we).by1),
                  () => Math.abs(v(Re).x0 - v(Re).x1) - v($e),
                  () => Math.min(v(Re).x0, v(Re).x1) + v($e) / 2,
                  () => Math.max(v(Re).x0, v(Re).x1) - v($e) / 2
                ]
              ), te(xe, Te);
            });
            var Se = oe(ye);
            uh(Se, {
              get proxy() {
                return V();
              },
              mode: "x",
              get value() {
                return v(d);
              },
              onChange: (xe) => H(d, xe != null && xe.x != null ? { x: xe.x } : null)
            }), te(K, U);
          },
          $$slots: { default: !0 }
        });
      };
      Fe(W, (G) => {
        v(g) != null && G(Y);
      });
    }
    te($, j);
  } }), ee(_);
  var k = oe(_, 2), T = ne(k);
  ee(k);
  var E = oe(k, 2), M = ne(E), R = ne(M);
  Is(R, {
    label: "X",
    get value() {
      return v(f);
    },
    set value(B) {
      H(f, B);
    }
  });
  var z = oe(R, 2);
  Is(z, {
    label: "Y",
    get value() {
      return v(h);
    },
    set value(B) {
      H(h, B);
    }
  }), ee(M), ee(E), Ne(() => {
    it(x, `↑ ${e.yField ?? ""}`), it(T, `${e.xField ?? ""} →`);
  }), te(t, y), yt(), n();
}
var zL = /* @__PURE__ */ _e('<hr class="mt-1 mb-1 border-slate-300 dark:border-slate-500 border-dashed"/>'), DL = (t, e, r) => e(v(r).x, t.shiftKey), OL = /* @__PURE__ */ _e('<div class="absolute left-0 top-0 bottom-0 rounded-sm"></div>'), LL = /* @__PURE__ */ _e('<!> <div class="absolute left-0 top-0 bottom-0 rounded-sm"></div>', 1), BL = /* @__PURE__ */ _e('<div class="absolute left-0 top-0 bottom-0 rounded-sm"></div>'), AL = /* @__PURE__ */ _e('<!> <div class="absolute left-0 top-0 bottom-0 rounded-sm"></div>', 1), qL = /* @__PURE__ */ _e('<!> <button class="text-left items-center flex py-0.5"><div class="w-40 flex-none overflow-hidden whitespace-nowrap text-ellipsis pr-1"><span> </span></div> <div class="flex-1 h-4 relative"><!></div> <div class="flex-none"><span><!></span></div></button>', 1), jL = (t, e, r) => {
  H(e, !v(e)), v(e) == !1 && H(r, null);
}, $L = /* @__PURE__ */ _e('<button class="py-0.5 text-left text-slate-400 dark:text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 whitespace-nowrap text-ellipsis w-full overflow-hidden"><!></button>'), UL = /* @__PURE__ */ _e('<!> <div class="flex"><div class="flex-1 pl-40 mr-2 overflow-hidden"><!></div> <div class="flex"><!></div></div>', 1), IL = /* @__PURE__ */ _e('<div class="flex flex-col text-sm w-full select-none"><!></div>');
function HL(t, e) {
  mt(e, !0);
  const [r, n] = Ei(), a = () => On(c, "$darkMode", r), o = 10, l = 100, u = yr.coordinator, c = yr.darkMode;
  let f = /* @__PURE__ */ me(null), h = /* @__PURE__ */ me(!1), d = /* @__PURE__ */ me(!1), g = /* @__PURE__ */ me(null), m = /* @__PURE__ */ me(400), y = /* @__PURE__ */ ie(() => v(g)?.items.reduce((L, q) => Math.max(L, v(d) ? q.selected : q.total), 0) ?? 0), w = /* @__PURE__ */ ie(() => Ks([0, Math.max(1, v(y))], [0, v(m) - 250])), x = /* @__PURE__ */ ie(() => (L) => L != 0 ? Math.max(1, v(w)(L)) : 0), _ = /* @__PURE__ */ ie(() => a() ? sn.dark : sn.light);
  function S(L, q, j, W) {
    let Y = /* @__PURE__ */ me(null);
    Ro(L, q, j).then((K) => {
      H(Y, K);
    });
    let G = /* @__PURE__ */ ie(() => v(Y) ? Nc({
      key: "x",
      stats: v(Y),
      binCount: v(h) ? l : o
    }) : null);
    function X(K, V, U) {
      return Ul({
        coordinator: L,
        selection: V,
        query: (Z) => N.Query.from(q).select({ ...K.select, count: N.count() }).where(Z).groupby(K.select.x),
        queryResult: (Z) => {
          U(Array.from(Z).map(K.collect));
        }
      });
    }
    et(() => {
      if (v(G) == null)
        return;
      let K = v(G), V = /* @__PURE__ */ me([]), U = /* @__PURE__ */ me([]), Z = X(K, null, (se) => {
        H(V, se);
      }), le = X(K, W, (se) => {
        H(U, se);
      });
      return le.reset = () => {
        H(f, null);
      }, et(() => {
        if (v(V).length > 0) {
          let se = (xe) => JSON.stringify(xe), ye = new Map(v(V).map(({ x: xe, count: Ee }) => [se(xe), Ee])), Se = new Map(v(U).map(({ x: xe, count: Ee }) => [se(xe), Ee]));
          if (v(V).every((xe) => typeof xe.x == "string")) {
            let xe = K.scales.x.specialValues ?? [], Ee = xe.filter((ge) => ge != "(null)").length > 0, Te = [...K.scales.x.domain, ...xe].map((ge) => ({
              x: ge,
              total: ye.get(se(ge)) ?? 0,
              selected: Se.get(se(ge)) ?? 0
            })), Re = Te.reduce((ge, we) => ge + we.total, 0), ke = Te.reduce((ge, we) => ge + we.selected, 0);
            H(g, {
              items: Te,
              sumTotal: Re,
              sumSelected: ke,
              firstSpecialIndex: K.scales.x.domain.length,
              hasOther: Ee
            });
          } else {
            let xe = Array.from(ye.keys()).map((ke) => JSON.parse(ke));
            xe = xe.sort((ke, ge) => {
              let we = typeof ke == "string" ? 1 / 0 : ke[0], $e = typeof ge == "string" ? 1 / 0 : ge[0];
              return we - $e;
            });
            let Ee = xe.map((ke) => ({
              x: ke,
              total: ye.get(se(ke)) ?? 0,
              selected: Se.get(se(ke)) ?? 0
            })), Te = Ee.reduce((ke, ge) => ke + ge.total, 0), Re = Ee.reduce((ke, ge) => ke + ge.selected, 0);
            H(g, {
              items: Ee,
              sumTotal: Te,
              sumSelected: Re,
              firstSpecialIndex: xe.findIndex((ke) => typeof ke == "string"),
              hasOther: !1
            });
          }
        }
      }), et(() => {
        let se = {
          source: le,
          clients: /* @__PURE__ */ new Set([le]),
          ...v(f) != null ? K.clause({ x: v(f) }) : { value: null, predicate: null }
        };
        W.update(se), W.activate(se);
      }), () => {
        Z.destroy(), le.destroy(), W.update({
          source: le,
          clients: /* @__PURE__ */ new Set([le]),
          value: null,
          predicate: null
        });
      };
    });
  }
  et(() => {
    S(u, e.table, e.field, e.filter);
  });
  const k = (L, q) => JSON.stringify(L) == JSON.stringify(q);
  function T(L, q) {
    if (v(f) == null || v(f).length == 0)
      H(f, [L]);
    else {
      let j = v(f).findIndex((W) => k(W, L)) >= 0;
      q ? j ? H(f, v(f).filter((W) => !k(W, L))) : H(f, [...v(f), L]) : j ? H(f, null) : H(f, [L]);
    }
  }
  et(() => Il(
    e.stateStore,
    () => ({
      selection: v(f),
      expanded: v(h),
      percentage: v(d)
    }),
    (L) => {
      H(f, L.selection), H(h, L.expanded), H(d, L.percentage);
    }
  ));
  const E = Xa(".6");
  function M(L) {
    return typeof L == "string" ? L : "[" + E(L[0]) + ", " + E(L[1]) + ")";
  }
  function R(L, q) {
    return q == 0 ? "-%" : (L / q * 100).toFixed(1) + "%";
  }
  var z = IL(), B = ne(z);
  {
    var $ = (L) => {
      var q = UL(), j = Ie(q);
      Xt(j, 17, () => v(g).items, or, (U, Z, le) => {
        var se = qL();
        const ye = /* @__PURE__ */ ie(() => v(f) == null || v(f).length == 0 || v(f).findIndex((Ze) => k(Ze, v(Z).x)) >= 0), Se = /* @__PURE__ */ ie(() => !v(g).items.every((Ze) => Ze.total == Ze.selected));
        var xe = Ie(se);
        {
          var Ee = (Ze) => {
            var Ut = zL();
            te(Ze, Ut);
          };
          Fe(xe, (Ze) => {
            le == v(g).firstSpecialIndex && Ze(Ee);
          });
        }
        var Te = oe(xe, 2);
        Te.__click = [DL, T, Z];
        var Re = ne(Te), ke = ne(Re);
        let ge;
        var we = ne(ke, !0);
        ee(ke), ee(Re);
        var $e = oe(Re, 2), qe = ne($e);
        {
          var Ve = (Ze) => {
            var Ut = LL(), _t = Ie(Ut);
            {
              var br = (At) => {
                var pr = OL();
                let xn;
                Ne((wn) => xn = nt(pr, "", xn, wn), [
                  () => ({
                    background: v(_).markColorFade,
                    width: `${v(x)(v(Z).total) ?? ""}px`
                  })
                ]), te(At, pr);
              };
              Fe(_t, (At) => {
                v(d) || At(br);
              });
            }
            var ur = oe(_t, 2);
            let Bt;
            Ne((At) => Bt = nt(ur, "", Bt, At), [
              () => ({
                background: v(_).markColor,
                width: `${v(x)(v(Z).selected) ?? ""}px`
              })
            ]), te(Ze, Ut);
          }, rt = (Ze) => {
            var Ut = AL(), _t = Ie(Ut);
            {
              var br = (At) => {
                var pr = BL();
                let xn;
                Ne((wn) => xn = nt(pr, "", xn, wn), [
                  () => ({
                    background: v(_).markColorGrayFade,
                    width: `${v(x)(v(Z).total) ?? ""}px`
                  })
                ]), te(At, pr);
              };
              Fe(_t, (At) => {
                v(d) || At(br);
              });
            }
            var ur = oe(_t, 2);
            let Bt;
            Ne((At) => Bt = nt(ur, "", Bt, At), [
              () => ({
                background: v(_).markColorGray,
                width: `${v(x)(v(Z).selected) ?? ""}px`
              })
            ]), te(Ze, Ut);
          };
          Fe(qe, (Ze) => {
            v(ye) ? Ze(Ve) : Ze(rt, !1);
          });
        }
        ee($e);
        var dt = oe($e, 2), ot = ne(dt);
        let wt;
        var He = ne(ot);
        {
          var We = (Ze) => {
            var Ut = dr(), _t = Ie(Ut);
            {
              var br = (Bt) => {
                var At = Fn();
                Ne((pr) => it(At, pr), [
                  () => R(v(Z).selected, v(g).sumSelected)
                ]), te(Bt, At);
              }, ur = (Bt) => {
                var At = Fn();
                Ne((pr) => it(At, pr), [
                  () => v(Z).selected.toLocaleString() + " / " + v(Z).total.toLocaleString()
                ]), te(Bt, At);
              };
              Fe(_t, (Bt) => {
                v(d) ? Bt(br) : Bt(ur, !1);
              });
            }
            te(Ze, Ut);
          }, Mt = (Ze) => {
            var Ut = dr(), _t = Ie(Ut);
            {
              var br = (Bt) => {
                var At = Fn();
                Ne((pr) => it(At, pr), [
                  () => R(v(Z).total, v(g).sumTotal)
                ]), te(Bt, At);
              }, ur = (Bt) => {
                var At = Fn();
                Ne((pr) => it(At, pr), [() => v(Z).total.toLocaleString()]), te(Bt, At);
              };
              Fe(
                _t,
                (Bt) => {
                  v(d) ? Bt(br) : Bt(ur, !1);
                },
                !0
              );
            }
            te(Ze, Ut);
          };
          Fe(He, (Ze) => {
            v(Se) ? Ze(We) : Ze(Mt, !1);
          });
        }
        ee(ot), ee(dt), ee(Te), Ne(
          (Ze, Ut, _t, br) => {
            Q(Te, "title", v(Z).x), ge = Sr(ke, 1, "", null, ge, Ze), it(we, Ut), wt = Sr(ot, 1, "text-slate-400 dark:text-slate-500", null, wt, _t), Q(ot, "title", br);
          },
          [
            () => ({
              "text-gray-400": !v(ye),
              "dark:text-gray-400": !v(ye)
            }),
            () => M(v(Z).x),
            () => ({
              "!text-gray-200": !v(ye),
              "dark:!text-gray-600": !v(ye)
            }),
            () => v(Se) ? `${v(Z).selected.toLocaleString()} / ${v(Z).total.toLocaleString()} (${R(v(Z).selected, v(Z).total)})
${R(v(Z).selected, v(g).sumSelected)} of selection` : `${v(Z).total.toLocaleString()}
${R(v(Z).total, v(g).sumTotal)} of all rows`
          ]
        ), te(U, se);
      });
      var W = oe(j, 2), Y = ne(W), G = ne(Y);
      {
        var X = (U) => {
          var Z = $L();
          Z.__click = [jL, h, f];
          var le = ne(Z);
          {
            var se = (Se) => {
              var xe = Fn();
              xe.nodeValue = "↑ Show up to 10 values", te(Se, xe);
            }, ye = (Se) => {
              var xe = Fn();
              xe.nodeValue = "↓ Show up to 100 values", te(Se, xe);
            };
            Fe(le, (Se) => {
              v(h) ? Se(se) : Se(ye, !1);
            });
          }
          ee(Z), te(U, Z);
        };
        Fe(G, (U) => {
          (v(h) || v(g).hasOther) && U(X);
        });
      }
      ee(Y);
      var K = oe(Y, 2), V = ne(K);
      ch(V, {
        options: [
          { value: "true", label: "%" },
          { value: "false", label: "#/#" }
        ],
        get value() {
          return v(d);
        },
        onChange: (U) => H(d, U == "true")
      }), ee(K), ee(W), te(L, q);
    };
    Fe(B, (L) => {
      v(g) && L($);
    });
  }
  ee(z), bl(z, "clientWidth", (L) => H(m, L)), te(t, z), yt(), n();
}
Nr(["click"]);
var WL = /* @__PURE__ */ xt("<rect></rect>"), GL = /* @__PURE__ */ xt("<rect></rect>"), VL = /* @__PURE__ */ xt("<!><!><!>", 1), XL = /* @__PURE__ */ _e('<div class="mt-2 flex gap items-center text-sm"><span class="flex-1 text-slate-400 dark:text-slate-500"><!></span> <!></div>'), YL = /* @__PURE__ */ _e("<div><!></div> <!>", 1);
function ZL(t, e) {
  mt(e, !0);
  const [r, n] = Ei(), a = () => On(u, "$darkMode", r);
  let o = tt(e, "binCount", 3, 20);
  const l = yr.coordinator, u = yr.darkMode;
  let c = /* @__PURE__ */ ie(() => a() ? sn.dark : sn.light), f = /* @__PURE__ */ me(null), h = /* @__PURE__ */ me(null), d = /* @__PURE__ */ me(null);
  function g(S, k, T, E) {
    let M = /* @__PURE__ */ me(null);
    Ro(S, k, T).then((B) => {
      H(M, B);
    });
    let R = /* @__PURE__ */ ie(() => v(M) ? Nc({
      key: "x",
      stats: v(M),
      scaleType: v(f),
      binCount: o()
    }) : null);
    et(() => {
      v(f) == null && H(f, v(R)?.scales.x?.type ?? null);
    });
    function z(B, $, L) {
      return Ul({
        coordinator: S,
        selection: $,
        query: (q) => N.Query.from(k).select({ ...B.select, count: N.count() }).where(q).groupby(B.select.x),
        queryResult: (q) => {
          L(Array.from(q).map(B.collect));
        }
      });
    }
    et(() => {
      if (v(R) == null)
        return;
      let B = v(R), $ = /* @__PURE__ */ me(gi([])), L = /* @__PURE__ */ me(gi([])), q = z(B, null, (W) => {
        H($, W, !0);
      }), j = z(B, E, (W) => {
        H(L, W, !0);
      });
      return j.reset = () => {
        H(h, null);
      }, et(() => {
        v($).length > 0 && H(d, {
          xScale: B.scales.x,
          allItems: v($),
          filteredItems: v(L)
        });
      }), et(() => {
        let W = {
          source: j,
          clients: /* @__PURE__ */ new Set([j]),
          ...v(h) != null ? B.clause(v(h)) : { value: null, predicate: null }
        };
        E.update(W), E.activate(W);
      }), () => {
        q.destroy(), j.destroy(), E.update({
          source: j,
          clients: /* @__PURE__ */ new Set([j]),
          value: null,
          predicate: null
        });
      };
    });
  }
  et(() => {
    g(l, e.table, e.field, e.filter);
  }), et(() => Il(e.stateStore, () => ({ brush: v(h), xScaleType: v(f) }), (S) => {
    H(h, S.brush), H(f, S.xScaleType);
  }));
  var m = YL(), y = Ie(m);
  nt(y, "", {}, { height: "200px" });
  var w = ne(y);
  oh(w, { children: (k, T = Ot, E = Ot) => {
    var M = dr(), R = Ie(M);
    {
      var z = (B) => {
        const $ = /* @__PURE__ */ ie(() => v(d).allItems.reduce((L, q) => Math.max(L, q.count), 1));
        {
          const L = (j, W = Ot) => {
            var Y = VL();
            const G = /* @__PURE__ */ ie(() => W().xScale), X = /* @__PURE__ */ ie(() => W().yScale);
            var K = Ie(Y);
            Xt(K, 17, () => v(d)?.allItems ?? [], or, (Z, le) => {
              var se = WL();
              const ye = /* @__PURE__ */ ie(() => {
                const [Ee, Te] = v(G).applyBand(v(le).x);
                return { x0: Ee, x1: Te };
              }), Se = /* @__PURE__ */ ie(() => {
                const [Ee, Te] = v(X).applyBand([0, v(le).count]);
                return { y0: Ee, y1: Te };
              }), xe = /* @__PURE__ */ ie(() => Math.min(Math.abs(v(ye).x1 - v(ye).x0) * 0.1, 1));
              Ne(
                (Ee, Te, Re, ke) => {
                  Q(se, "x", Ee), Q(se, "y", Te), Q(se, "width", Re), Q(se, "height", ke), Q(se, "fill", v(c).markColorFade);
                },
                [
                  () => Math.min(v(ye).x0, v(ye).x1) + v(xe) / 2,
                  () => Math.min(v(Se).y0, v(Se).y1),
                  () => Math.abs(v(ye).x0 - v(ye).x1) - v(xe),
                  () => Math.abs(v(Se).y0 - v(Se).y1)
                ]
              ), te(Z, se);
            });
            var V = oe(K);
            Xt(V, 17, () => v(d)?.filteredItems ?? [], or, (Z, le) => {
              var se = GL();
              const ye = /* @__PURE__ */ ie(() => {
                const [Ee, Te] = v(G).applyBand(v(le).x);
                return { x0: Ee, x1: Te };
              }), Se = /* @__PURE__ */ ie(() => {
                const [Ee, Te] = v(X).applyBand([0, v(le).count]);
                return { y0: Ee, y1: Te };
              }), xe = /* @__PURE__ */ ie(() => Math.min(Math.abs(v(ye).x1 - v(ye).x0) * 0.1, 1));
              Ne(
                (Ee, Te, Re, ke) => {
                  Q(se, "x", Ee), Q(se, "height", Te), Q(se, "y", Re), Q(se, "width", ke), Q(se, "fill", v(c).markColor);
                },
                [
                  () => Math.min(v(ye).x0, v(ye).x1) + v(xe) / 2,
                  () => Math.abs(v(Se).y0 - v(Se).y1),
                  () => Math.min(v(Se).y0, v(Se).y1),
                  () => Math.abs(v(ye).x0 - v(ye).x1) - v(xe)
                ]
              ), te(Z, se);
            });
            var U = oe(V);
            uh(U, {
              get proxy() {
                return W();
              },
              mode: "x",
              get value() {
                return v(h);
              },
              onChange: (Z) => H(h, Z != null && Z.x != null ? { x: Z.x } : null)
            }), te(j, Y);
          };
          let q = /* @__PURE__ */ ie(() => ({ type: "linear", domain: [0, v($)] }));
          gc(B, {
            get width() {
              return T();
            },
            get height() {
              return E();
            },
            get xScale() {
              return v(d).xScale;
            },
            get yScale() {
              return v(q);
            },
            children: L,
            $$slots: { default: !0 }
          });
        }
      };
      Fe(R, (B) => {
        v(d) != null && B(z);
      });
    }
    te(k, M);
  } }), ee(y);
  var x = oe(y, 2);
  {
    var _ = (S) => {
      var k = XL(), T = ne(k), E = ne(T);
      {
        var M = (z) => {
          var B = dr(), $ = Ie(B);
          {
            var L = (j) => {
              var W = Fn();
              Ne(() => it(W, `[${v(h).x ?? ""}]`)), te(j, W);
            }, q = (j) => {
              var W = Fn();
              const Y = /* @__PURE__ */ ie(() => Xa(".4"));
              Ne((G, X) => it(W, `[${G ?? ""}, ${X ?? ""}]`), [
                () => v(Y)(v(h).x[0]),
                () => v(Y)(v(h).x[1])
              ]), te(j, W);
            };
            Fe($, (j) => {
              typeof v(h).x == "string" ? j(L) : j(q, !1);
            });
          }
          te(z, B);
        };
        Fe(E, (z) => {
          v(h) && z(M);
        });
      }
      ee(T);
      var R = oe(T, 2);
      Is(R, {
        label: "X",
        get value() {
          return v(f);
        },
        set value(z) {
          H(f, z);
        }
      }), ee(k), te(S, k);
    };
    Fe(x, (S) => {
      v(d)?.xScale.type != "band" && S(_);
    });
  }
  te(t, m), yt(), n();
}
var KL = /* @__PURE__ */ xt('<image preserveAspectRatio="none"></image>');
function JL(t, e) {
  mt(e, !0);
  let r = /* @__PURE__ */ ie(() => e.proxy.xScale && e.xDomain ? e.proxy.xScale.apply(e.xDomain[0]) : 0), n = /* @__PURE__ */ ie(() => e.proxy.xScale && e.xDomain ? e.proxy.xScale.apply(e.xDomain[1]) : e.proxy.plotWidth), a = /* @__PURE__ */ ie(() => e.proxy.yScale && e.yDomain ? e.proxy.yScale.apply(e.yDomain[0]) : 0), o = /* @__PURE__ */ ie(() => e.proxy.yScale && e.yDomain ? e.proxy.yScale.apply(e.yDomain[1]) : e.proxy.plotHeight), l = /* @__PURE__ */ me(null), u = document.createElement("canvas");
  et(() => {
    u.width = e.rasterWidth, u.height = e.rasterHeight;
    let f = u.getContext("2d", { colorSpace: "srgb", willReadFrequently: !0 });
    f.clearRect(0, 0, u.width, u.height);
    let h = f.getImageData(0, 0, u.width, u.height), d = 0;
    for (let g = 0; g < u.height; g++)
      for (let m = 0; m < u.width; m++) {
        let y = (m + 0.5) / u.width * (v(n) - v(r)) + v(r), w = (g + 0.5) / u.height * (v(o) - v(a)) + v(a), x = e.proxy.xScale?.invert(y) ?? 0, _ = e.proxy.yScale?.invert(w) ?? 0, { r: S, g: k, b: T, opacity: E } = vc(e.color(x, _));
        h.data[d++] = S, h.data[d++] = k, h.data[d++] = T, h.data[d++] = E * 255;
      }
    f.putImageData(h, 0, 0), H(l, u.toDataURL("image/png"), !0);
  });
  var c = KL();
  Ne(
    (f, h, d, g) => {
      Q(c, "x", f), Q(c, "y", h), Q(c, "width", d), Q(c, "height", g), Q(c, "href", v(l));
    },
    [
      () => Math.min(v(r), v(n)),
      () => Math.min(v(a), v(o)),
      () => Math.abs(v(r) - v(n)),
      () => Math.abs(v(a) - v(o))
    ]
  ), te(t, c), yt();
}
var QL = /* @__PURE__ */ xt("<rect></rect>"), eB = /* @__PURE__ */ xt("<rect></rect><!>", 1), tB = /* @__PURE__ */ _e('<div class="text-slate-400 mb-1 select-none"> </div> <div><!></div> <div class="text-slate-400 mb-1 select-none text-right"> </div> <div class="flex gap items-center text-sm"><span class="flex-1 text-slate-400 dark:text-slate-500"><!></span> <span class="flex flex-col items-end gap-1"><span class="flex gap-2"><!> <!></span> <span class="flex gap-1 select-none"><span class="text-slate-400 dark:text-slate-500 text-sm">Normalize:</span> <!></span></span></div>', 1);
function rB(t, e) {
  mt(e, !0);
  const [r, n] = Ei(), a = () => On(c, "$darkMode", r);
  let o = tt(e, "xBinCount", 3, 20), l = tt(e, "yBinCount", 3, 20);
  const u = yr.coordinator, c = yr.darkMode;
  let f = /* @__PURE__ */ me(null), h = /* @__PURE__ */ me(null), d = /* @__PURE__ */ me(null), g = /* @__PURE__ */ me(null), m = /* @__PURE__ */ me(null), y = /* @__PURE__ */ ie(() => v(m)?.items.reduce((V, U) => Math.max(V, U.value), 1) ?? 1);
  const w = 0.07, x = (V) => V > 0 ? w + (1 - w) * V : 0;
  let _ = /* @__PURE__ */ ie(() => a() ? (V) => Hk(x(V / v(y))) : (V) => VO(x(V / v(y))));
  function S(V, U, Z, le, se) {
    let ye = /* @__PURE__ */ me(null);
    Promise.all([
      Ro(V, U, Z),
      Ro(V, U, le)
    ]).then(([Ee, Te]) => {
      H(ye, Ee != null && Te != null ? { x: Ee, y: Te } : null);
    });
    let Se = /* @__PURE__ */ ie(() => v(ye) ? Nc(
      {
        key: "x",
        stats: v(ye).x,
        scaleType: v(f),
        binCount: o()
      },
      {
        key: "y",
        stats: v(ye).y,
        scaleType: v(h),
        binCount: l()
      }
    ) : null);
    et(() => {
      v(f) == null && H(f, v(Se)?.scales.x?.type ?? null), v(h) == null && H(h, v(Se)?.scales.y?.type ?? null);
    });
    function xe(Ee, Te, Re) {
      return Ul({
        coordinator: V,
        selection: Te,
        query: (ke) => N.Query.from(N.Query.from(U).select({ ...Ee.select, count: N.count() }).where(ke).groupby(Ee.select.x, Ee.select.y)).select({
          x: "x",
          y: "y",
          count: "count",
          normalizeByX: N.sql`count / (SUM(count) OVER (PARTITION BY x))`,
          normalizeByY: N.sql`count / (SUM(count) OVER (PARTITION BY y))`
        }),
        queryResult: (ke) => {
          Re(Array.from(ke).map(Ee.collect));
        }
      });
    }
    et(() => {
      if (v(Se) == null)
        return;
      let Ee = v(Se), Te = /* @__PURE__ */ me(null), Re = xe(Ee, se, (ke) => {
        H(Te, ke);
      });
      return Re.reset = () => {
        H(g, null);
      }, et(() => {
        v(Te) != null && H(m, {
          xScale: Ee.scales.x,
          yScale: Ee.scales.y,
          items: v(Te).map((ke) => ({
            x: ke.x,
            y: ke.y,
            value: v(d) == "x" ? ke.normalizeByX : v(d) == "y" ? ke.normalizeByY : ke.count
          }))
        });
      }), et(() => {
        let ke = {
          source: Re,
          clients: /* @__PURE__ */ new Set([Re]),
          ...v(g) != null ? Ee.clause(v(g)) : { value: null, predicate: null }
        };
        se.update(ke), se.activate(ke);
      }), () => {
        Re.destroy(), se.update({
          source: Re,
          clients: /* @__PURE__ */ new Set([Re]),
          value: null,
          predicate: null
        });
      };
    });
  }
  et(() => {
    S(u, e.table, e.xField, e.yField, e.filter);
  }), et(() => Il(
    e.stateStore,
    () => ({
      brush: v(g),
      xScaleType: v(f),
      yScaleType: v(h),
      normalization: v(d)
    }),
    (V) => {
      H(g, V.brush), H(f, V.xScaleType), H(h, V.yScaleType), H(d, V.normalization);
    }
  ));
  var k = tB(), T = Ie(k), E = ne(T);
  ee(T);
  var M = oe(T, 2);
  nt(M, "", {}, { height: "320px" });
  var R = ne(M);
  oh(R, { children: (U, Z = Ot, le = Ot) => {
    var se = dr(), ye = Ie(se);
    {
      var Se = (xe) => {
        gc(xe, {
          get width() {
            return Z();
          },
          get height() {
            return le();
          },
          get xScale() {
            return v(m).xScale;
          },
          get yScale() {
            return v(m).yScale;
          },
          childrenBelow: (Re, ke = Ot) => {
            var ge = eB();
            const we = /* @__PURE__ */ ie(() => ke().xScale), $e = /* @__PURE__ */ ie(() => ke().yScale);
            var qe = Ie(ge);
            Q(qe, "x", 0), Q(qe, "y", 0);
            var Ve = oe(qe);
            Xt(Ve, 17, () => v(m)?.items ?? [], or, (rt, dt) => {
              var ot = QL();
              const wt = /* @__PURE__ */ ie(() => {
                const [Mt, Ze] = v(we).applyBand(v(dt).x);
                return { x0: Mt, x1: Ze };
              }), He = /* @__PURE__ */ ie(() => {
                const [Mt, Ze] = v($e).applyBand(v(dt).y);
                return { y0: Mt, y1: Ze };
              }), We = /* @__PURE__ */ ie(() => 0);
              Ne(
                (Mt, Ze, Ut, _t, br) => {
                  Q(ot, "x", Mt), Q(ot, "y", Ze), Q(ot, "width", Ut), Q(ot, "height", _t), Q(ot, "fill", br);
                },
                [
                  () => Math.min(v(wt).x0, v(wt).x1) + v(We) / 2,
                  () => Math.min(v(He).y0, v(He).y1) + v(We) / 2,
                  () => Math.abs(v(wt).x0 - v(wt).x1) - v(We),
                  () => Math.abs(v(He).y0 - v(He).y1) - v(We),
                  () => v(_)(v(dt).value)
                ]
              ), te(rt, ot);
            }), Ne(
              (rt) => {
                Q(qe, "width", ke().plotWidth), Q(qe, "height", ke().plotHeight), Q(qe, "fill", rt);
              },
              [() => v(_)(0)]
            ), te(Re, ge);
          },
          children: (Re, ke = Ot) => {
            uh(Re, {
              get proxy() {
                return ke();
              },
              mode: "xy",
              get value() {
                return v(g);
              },
              onChange: (ge) => H(g, ge != null && ge.x != null && ge.y != null ? { x: ge.x, y: ge.y } : null)
            });
          },
          $$slots: { childrenBelow: !0, default: !0 }
        });
      };
      Fe(ye, (xe) => {
        v(m) != null && xe(Se);
      });
    }
    te(U, se);
  } }), ee(M);
  var z = oe(M, 2), B = ne(z);
  ee(z);
  var $ = oe(z, 2), L = ne($), q = ne(L);
  {
    const V = (Z, le = Ot) => {
      {
        let se = /* @__PURE__ */ ie(() => le().xScale?.domain);
        JL(Z, {
          get color() {
            return v(_);
          },
          rasterWidth: 100,
          rasterHeight: 1,
          get proxy() {
            return le();
          },
          get xDomain() {
            return v(se);
          }
        });
      }
    };
    let U = /* @__PURE__ */ ie(() => ({ type: "linear", domain: [0, v(y)] }));
    gc(q, {
      get xScale() {
        return v(U);
      },
      xAxis: { extendScaleToTicks: !1 },
      width: 230,
      height: 24,
      extents: { left: 30, right: 30, top: 0, bottom: 0 },
      children: V,
      $$slots: { default: !0 }
    });
  }
  ee(L);
  var j = oe(L, 2), W = ne(j), Y = ne(W);
  Is(Y, {
    label: "X",
    get value() {
      return v(f);
    },
    set value(V) {
      H(f, V);
    }
  });
  var G = oe(Y, 2);
  Is(G, {
    label: "Y",
    get value() {
      return v(h);
    },
    set value(V) {
      H(h, V);
    }
  }), ee(W);
  var X = oe(W, 2), K = oe(ne(X), 2);
  ch(K, {
    options: [
      { value: null, label: "off" },
      { value: "x", label: "X" },
      { value: "y", label: "Y" }
    ],
    get value() {
      return v(d);
    },
    onChange: (V) => H(d, V)
  }), ee(X), ee(j), ee($), Ne(() => {
    it(E, `↑ ${e.yField ?? ""}`), it(B, `${e.xField ?? ""} →`);
  }), te(t, k), yt(), n();
}
var nB = /* @__PURE__ */ xt("<rect></rect>"), iB = /* @__PURE__ */ xt("<rect></rect>"), aB = /* @__PURE__ */ xt("<!><!><!>", 1), oB = /* @__PURE__ */ _e('<div class="flex gap-1 items-center"><div class="w-3 h-3 block rounded-sm"></div> <div class="whitespace-nowrap max-w-32 overflow-hidden text-ellipsis"> </div></div>'), lB = /* @__PURE__ */ _e('<div class="flex gap-2 flex-wrap items-center select-none"></div>'), sB = /* @__PURE__ */ _e('<div><!></div> <div class="mt-2 flex gap-2 items-start text-sm"><div class="flex-1 text-slate-400 dark:text-slate-500"><!></div> <span class="flex flex-col items-end gap-1"><!> <span class="flex gap-1 select-none"><span class="text-slate-400 dark:text-slate-500 text-sm">Normalize:</span> <!></span></span></div>', 1);
function uB(t, e) {
  mt(e, !0);
  const [r, n] = Ei(), a = () => On(c, "$darkMode", r);
  let o = tt(e, "xBinCount", 3, 20), l = tt(e, "groupBinCount", 3, 20);
  const u = yr.coordinator, c = yr.darkMode;
  let f = /* @__PURE__ */ ie(() => a() ? sn.dark : sn.light), h = /* @__PURE__ */ me(null), d = /* @__PURE__ */ me(null), g = /* @__PURE__ */ me(null), m = /* @__PURE__ */ me(null);
  function y(q, j, W, Y, G) {
    let X = /* @__PURE__ */ me(null);
    Promise.all([
      Ro(q, j, W),
      Ro(q, j, Y)
    ]).then(([U, Z]) => {
      H(X, U != null && Z != null ? { x: U, group: Z } : null);
    });
    let K = /* @__PURE__ */ ie(() => v(X) ? Nc(
      {
        key: "x",
        stats: v(X).x,
        scaleType: v(h),
        binCount: o()
      },
      {
        key: "group",
        stats: v(X).group,
        binCount: l()
      }
    ) : null);
    et(() => {
      v(h) == null && H(h, v(K)?.scales.x?.type ?? null);
    });
    function V(U, Z, le) {
      return Ul({
        coordinator: q,
        selection: Z,
        query: (se) => N.Query.from(N.Query.from(j).select({ ...U.select, count: N.count() }).where(se).groupby(U.select.x, U.select.group)).select({
          x: "x",
          group: "group",
          count: "count",
          normalizeByX: N.sql`count / (SUM(count) OVER (PARTITION BY x))`
        }),
        queryResult: (se) => {
          le(Array.from(se).map(U.collect));
        }
      });
    }
    et(() => {
      if (v(K) == null)
        return;
      let U = v(K), Z = /* @__PURE__ */ me(null), le = /* @__PURE__ */ me(null), se = V(U, null, (Se) => {
        H(Z, Se);
      }), ye = V(U, G, (Se) => {
        H(le, Se);
      });
      return ye.reset = () => {
        H(g, null);
      }, et(() => {
        if (v(Z) != null && v(le) != null) {
          let Se = (we) => JSON.stringify(we), xe = v(d) == "x" ? "normalizeByX" : "count", Ee = Array.from(w(v(Z), (we) => Se(we.group), (we) => we[0].group).entries()).sort((we, $e) => U.order.group(we[1], $e[1])), Te = w(v(Z), (we) => Se(we.x), (we) => ({
            x: we[0].x,
            total: we.reduce(($e, qe) => $e + qe[xe], 0)
          })), Re = w(v(le), (we) => Se(we.x), (we) => {
            we = we.sort((Ve, rt) => U.order.group(Ve.group, rt.group));
            let $e = [], qe = 0;
            for (let Ve of we)
              $e.push({ group: Ve.group, y1: qe, y2: qe + Ve[xe] }), qe += Ve[xe];
            return { x: we[0].x, groups: $e };
          }), ke = Te.values().reduce((we, $e) => Math.max(we, $e.total), 1);
          v(d) && (ke = 1);
          let ge = aL(Array.from(Ee.map((we) => we[1])), {
            fade: ["n/a", "(null)"],
            ordinal: U.scales.group.type != "band"
          });
          H(m, {
            xScale: U.scales.x,
            yScale: { type: "linear", domain: [0, ke] },
            colorScale: ge,
            totals: Array.from(Te.values()),
            items: Array.from(Re.values())
          });
        }
      }), et(() => {
        let Se = {
          source: ye,
          clients: /* @__PURE__ */ new Set([ye]),
          ...v(g) != null ? U.clause(v(g)) : { value: null, predicate: null }
        };
        G.update(Se), G.activate(Se);
      }), () => {
        se.destroy(), ye.destroy(), G.update({
          source: ye,
          clients: /* @__PURE__ */ new Set([ye]),
          value: null,
          predicate: null
        });
      };
    });
  }
  et(() => {
    y(u, e.table, e.xField, e.groupField, e.filter);
  }), et(() => Il(
    e.stateStore,
    () => ({
      brush: v(g),
      xScaleType: v(h),
      normalization: v(d)
    }),
    (q) => {
      H(g, q.brush), H(h, q.xScaleType), H(d, q.normalization);
    }
  ));
  function w(q, j, W) {
    let Y = /* @__PURE__ */ new Map();
    for (let G of q) {
      let X = j(G), K = Y.get(X);
      K || (K = [], Y.set(X, K)), K.push(G);
    }
    return new Map(Y.entries().map(([G, X]) => [G, W(X)]));
  }
  function x(q) {
    if (typeof q == "string")
      return q;
    {
      let j = Xa(".6");
      if (q.length == 2)
        return `[${j(q[0])}, ${j(q[1])})`;
    }
    return "(invalid)";
  }
  var _ = sB(), S = Ie(_);
  nt(S, "", {}, { height: "200px" });
  var k = ne(S);
  oh(k, { children: (j, W = Ot, Y = Ot) => {
    var G = dr(), X = Ie(G);
    {
      var K = (V) => {
        gc(V, {
          get width() {
            return W();
          },
          get height() {
            return Y();
          },
          get xScale() {
            return v(m).xScale;
          },
          get yScale() {
            return v(m).yScale;
          },
          children: (Z, le = Ot) => {
            var se = aB();
            const ye = /* @__PURE__ */ ie(() => le().xScale), Se = /* @__PURE__ */ ie(() => le().yScale);
            var xe = Ie(se);
            Xt(xe, 17, () => v(m)?.totals ?? [], or, (Re, ke) => {
              var ge = nB();
              const we = /* @__PURE__ */ ie(() => {
                const [Ve, rt] = v(ye).applyBand(v(ke).x);
                return { x0: Ve, x1: rt };
              }), $e = /* @__PURE__ */ ie(() => {
                const [Ve, rt] = v(Se).applyBand([0, v(ke).total]);
                return { y0: Ve, y1: rt };
              }), qe = /* @__PURE__ */ ie(() => Math.min(Math.abs(v(we).x1 - v(we).x0) * 0.2, Math.abs(v($e).y1 - v($e).y0) * 0.2, 1));
              Ne(
                (Ve, rt, dt, ot) => {
                  Q(ge, "x", Ve), Q(ge, "y", rt), Q(ge, "width", dt), Q(ge, "height", ot), Q(ge, "fill", v(f).markColorFade);
                },
                [
                  () => Math.min(v(we).x0, v(we).x1) + v(qe) / 2,
                  () => Math.min(v($e).y0, v($e).y1),
                  () => Math.abs(v(we).x0 - v(we).x1) - v(qe),
                  () => Math.abs(v($e).y0 - v($e).y1)
                ]
              ), te(Re, ge);
            });
            var Ee = oe(xe);
            Xt(Ee, 17, () => v(m)?.items ?? [], or, (Re, ke) => {
              let ge = () => v(ke).x, we = () => v(ke).groups;
              var $e = dr();
              const qe = /* @__PURE__ */ ie(() => {
                const [rt, dt] = v(ye).applyBand(ge());
                return { x0: rt, x1: dt };
              });
              var Ve = Ie($e);
              Xt(Ve, 17, we, or, (rt, dt) => {
                var ot = iB();
                const wt = /* @__PURE__ */ ie(() => {
                  const [We, Mt] = v(Se).applyBand([v(dt).y1, v(dt).y2]);
                  return { y0: We, y1: Mt };
                }), He = /* @__PURE__ */ ie(() => Math.min(Math.abs(v(qe).x1 - v(qe).x0) * 0.2, Math.abs(v(wt).y1 - v(wt).y0) * 0.2, 1));
                Ne(
                  (We, Mt, Ze, Ut, _t) => {
                    Q(ot, "x", We), Q(ot, "y", Mt), Q(ot, "width", Ze), Q(ot, "height", Ut), Q(ot, "fill", _t);
                  },
                  [
                    () => Math.min(v(qe).x0, v(qe).x1) + v(He) / 2,
                    () => Math.min(v(wt).y0, v(wt).y1),
                    () => Math.abs(v(qe).x0 - v(qe).x1) - v(He),
                    () => Math.abs(v(wt).y0 - v(wt).y1),
                    () => v(m)?.colorScale.apply(v(dt).group)
                  ]
                ), te(rt, ot);
              }), te(Re, $e);
            });
            var Te = oe(Ee);
            uh(Te, {
              get proxy() {
                return le();
              },
              mode: "x",
              get value() {
                return v(g);
              },
              onChange: (Re) => H(g, Re != null && Re.x != null ? { x: Re.x } : null)
            }), te(Z, se);
          },
          $$slots: { default: !0 }
        });
      };
      Fe(X, (V) => {
        v(m) != null && V(K);
      });
    }
    te(j, G);
  } }), ee(S);
  var T = oe(S, 2), E = ne(T), M = ne(E);
  {
    var R = (q) => {
      var j = lB();
      Xt(j, 21, () => v(m).colorScale.domain, or, (W, Y) => {
        var G = oB(), X = ne(G);
        let K;
        var V = oe(X, 2), U = ne(V, !0);
        ee(V), ee(G), Ne(
          (Z, le, se) => {
            Q(G, "title", Z), K = nt(X, "", K, le), it(U, se);
          },
          [
            () => JSON.stringify(v(Y)),
            () => ({ background: v(m).colorScale.apply(v(Y)) }),
            () => x(v(Y))
          ]
        ), te(W, G);
      }), ee(j), te(q, j);
    };
    Fe(M, (q) => {
      v(m) && q(R);
    });
  }
  ee(E);
  var z = oe(E, 2), B = ne(z);
  Is(B, {
    label: "X",
    get value() {
      return v(h);
    },
    set value(q) {
      H(h, q);
    }
  });
  var $ = oe(B, 2), L = oe(ne($), 2);
  ch(L, {
    options: [{ value: null, label: "off" }, { value: "x", label: "X" }],
    get value() {
      return v(d);
    },
    onChange: (q) => H(d, q)
  }), ee($), ee(z), ee(T), te(t, _), yt(), n();
}
async function cB(t, e, r, n) {
  let a = N.column(r, e), o = await t.query(N.Query.from(N.Query.from(e).select({ value: N.sql`UNNEST(${a})` })).select({ value: "value", count: N.count() }).groupby("value").orderby(N.desc("count")).limit(n + 1)), l = Array.from(o);
  return {
    values: l.slice(0, n),
    hasOther: l.length > n
  };
}
function fB(t, e) {
  return N.or(...e.map((r) => N.sql`${N.literal(r)} IN ${N.column(t)}`));
}
var dB = /* @__PURE__ */ _e('<hr class="mt-1 mb-1 border-slate-300 dark:border-slate-500 border-dashed"/>'), hB = (
  // Adjust scale so the minimum width for non-zero count is 1px.
  // Query the stats
  // Sync selection with brush
  // Sync with state store
  (t, e, r) => e(v(r).x, t.shiftKey)
), vB = /* @__PURE__ */ _e('<div class="absolute left-0 top-0 bottom-0 rounded-sm"></div> <div class="absolute left-0 top-0 bottom-0 rounded-sm"></div>', 1), pB = /* @__PURE__ */ _e('<div class="absolute left-0 top-0 bottom-0 rounded-sm"></div> <div class="absolute left-0 top-0 bottom-0 rounded-sm"></div>', 1), gB = /* @__PURE__ */ _e('<!> <button class="text-left items-center flex py-0.5"><div class="w-40 flex-none overflow-hidden whitespace-nowrap text-ellipsis pr-1"><span> </span></div> <div class="flex-1 h-4 relative"><!></div> <div class="flex-none"><span><!></span></div></button>', 1), mB = (t, e, r) => {
  H(e, !v(e)), v(e) == !1 && H(r, null);
}, yB = /* @__PURE__ */ _e('<button class="py-0.5 text-left text-slate-400 dark:text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 whitespace-nowrap text-ellipsis w-full overflow-hidden"><!></button>'), bB = /* @__PURE__ */ _e('<!> <div class="flex"><div class="flex-1 pl-40 mr-2 overflow-hidden"><!></div></div>', 1), xB = /* @__PURE__ */ _e('<div class="flex flex-col text-sm w-full select-none"><!></div>');
function wB(t, e) {
  mt(e, !0);
  const [r, n] = Ei(), a = () => On(c, "$darkMode", r), o = 10, l = 100, u = yr.coordinator, c = yr.darkMode;
  let f = /* @__PURE__ */ me(null), h = /* @__PURE__ */ me(!1), d = /* @__PURE__ */ me(null), g = /* @__PURE__ */ me(400), m = /* @__PURE__ */ ie(() => v(d)?.items.reduce(($, L) => Math.max($, L.total), 0) ?? 0), y = /* @__PURE__ */ ie(() => Ks([0, Math.max(1, v(m))], [0, v(g) - 250])), w = /* @__PURE__ */ ie(() => ($) => $ != 0 ? Math.max(1, v(y)($)) : 0), x = /* @__PURE__ */ ie(() => a() ? sn.dark : sn.light);
  function _($, L, q, j, W) {
    let Y = /* @__PURE__ */ me(null);
    cB($, L, q, W).then((X) => {
      H(Y, X);
    });
    function G(X, K, V) {
      return Ul({
        coordinator: $,
        selection: X,
        query: (U) => {
          let Z = N.column(q, L);
          return N.Query.from(N.Query.from(L).select({ value: N.sql`UNNEST(${Z})` }).where(U)).select({ x: "value", count: N.count() }).where(N.isIn("value", K.map((le) => N.literal(le)))).groupby("value").orderby(N.desc("count"));
        },
        queryResult: (U) => {
          V(Array.from(U));
        }
      });
    }
    et(() => {
      if (v(Y) == null)
        return;
      let X = v(Y).values.map((se) => se.value), K = v(Y).hasOther, V = /* @__PURE__ */ me([]), U = /* @__PURE__ */ me([]), Z = G(null, X, (se) => {
        H(V, se);
      }), le = G(j, X, (se) => {
        H(U, se);
      });
      return le.reset = () => {
        H(f, null);
      }, et(() => {
        if (v(V).length > 0) {
          let se = (Ee) => JSON.stringify(Ee), ye = new Map(v(V).map(({ x: Ee, count: Te }) => [se(Ee), Te])), Se = new Map(v(U).map(({ x: Ee, count: Te }) => [se(Ee), Te])), xe = X.map((Ee) => ({
            x: Ee,
            total: ye.get(se(Ee)) ?? 0,
            selected: Se.get(se(Ee)) ?? 0
          }));
          H(d, { items: xe, firstSpecialIndex: X.length, hasOther: K });
        }
      }), et(() => {
        let se = {
          source: le,
          clients: /* @__PURE__ */ new Set([le]),
          ...v(f) != null ? {
            value: v(f),
            predicate: fB(q, v(f))
          } : { value: null, predicate: null }
        };
        j.update(se), j.activate(se);
      }), () => {
        Z.destroy(), le.destroy(), j.update({
          source: le,
          clients: /* @__PURE__ */ new Set([le]),
          value: null,
          predicate: null
        });
      };
    });
  }
  et(() => {
    _(u, e.table, e.field, e.filter, v(h) ? l : o);
  });
  const S = ($, L) => JSON.stringify($) == JSON.stringify(L);
  function k($, L) {
    if (v(f) == null || v(f).length == 0)
      H(f, [$]);
    else {
      let q = v(f).findIndex((j) => S(j, $)) >= 0;
      L ? q ? H(f, v(f).filter((j) => !S(j, $))) : H(f, [...v(f), $]) : q ? H(f, null) : H(f, [$]);
    }
  }
  et(() => Il(e.stateStore, () => ({ selection: v(f), expanded: v(h) }), ($) => {
    H(f, $.selection), H(h, $.expanded);
  }));
  const T = Xa(".6");
  function E($) {
    return typeof $ == "string" ? $ : "[" + T($[0]) + ", " + T($[1]) + ")";
  }
  function M($, L) {
    return L == 0 ? "-%" : ($ / L * 100).toFixed(1) + "%";
  }
  var R = xB(), z = ne(R);
  {
    var B = ($) => {
      var L = bB(), q = Ie(L);
      Xt(q, 17, () => v(d).items, or, (X, K, V) => {
        var U = gB();
        const Z = /* @__PURE__ */ ie(() => v(f) == null || v(f).length == 0 || v(f).findIndex((He) => S(He, v(K).x)) >= 0), le = /* @__PURE__ */ ie(() => !v(d).items.every((He) => He.total == He.selected));
        var se = Ie(U);
        {
          var ye = (He) => {
            var We = dB();
            te(He, We);
          };
          Fe(se, (He) => {
            V == v(d).firstSpecialIndex && He(ye);
          });
        }
        var Se = oe(se, 2);
        Se.__click = [hB, k, K];
        var xe = ne(Se), Ee = ne(xe);
        let Te;
        var Re = ne(Ee, !0);
        ee(Ee), ee(xe);
        var ke = oe(xe, 2), ge = ne(ke);
        {
          var we = (He) => {
            var We = vB(), Mt = Ie(We);
            let Ze;
            var Ut = oe(Mt, 2);
            let _t;
            Ne(
              (br, ur) => {
                Ze = nt(Mt, "", Ze, br), _t = nt(Ut, "", _t, ur);
              },
              [
                () => ({
                  background: v(x).markColorFade,
                  width: `${v(w)(v(K).total) ?? ""}px`
                }),
                () => ({
                  background: v(x).markColor,
                  width: `${v(w)(v(K).selected) ?? ""}px`
                })
              ]
            ), te(He, We);
          }, $e = (He) => {
            var We = pB(), Mt = Ie(We);
            let Ze;
            var Ut = oe(Mt, 2);
            let _t;
            Ne(
              (br, ur) => {
                Ze = nt(Mt, "", Ze, br), _t = nt(Ut, "", _t, ur);
              },
              [
                () => ({
                  background: v(x).markColorGrayFade,
                  width: `${v(w)(v(K).total) ?? ""}px`
                }),
                () => ({
                  background: v(x).markColorGray,
                  width: `${v(w)(v(K).selected) ?? ""}px`
                })
              ]
            ), te(He, We);
          };
          Fe(ge, (He) => {
            v(Z) ? He(we) : He($e, !1);
          });
        }
        ee(ke);
        var qe = oe(ke, 2), Ve = ne(qe);
        let rt;
        var dt = ne(Ve);
        {
          var ot = (He) => {
            var We = Fn();
            Ne((Mt) => it(We, Mt), [
              () => v(K).selected.toLocaleString() + " / " + v(K).total.toLocaleString()
            ]), te(He, We);
          }, wt = (He) => {
            var We = Fn();
            Ne((Mt) => it(We, Mt), [() => v(K).total.toLocaleString()]), te(He, We);
          };
          Fe(dt, (He) => {
            v(le) ? He(ot) : He(wt, !1);
          });
        }
        ee(Ve), ee(qe), ee(Se), Ne(
          (He, We, Mt, Ze) => {
            Q(Se, "title", v(K).x), Te = Sr(Ee, 1, "", null, Te, He), it(Re, We), rt = Sr(Ve, 1, "text-slate-400 dark:text-slate-500", null, rt, Mt), Q(Ve, "title", Ze);
          },
          [
            () => ({
              "text-gray-400": !v(Z),
              "dark:text-gray-400": !v(Z)
            }),
            () => E(v(K).x),
            () => ({
              "!text-gray-200": !v(Z),
              "dark:!text-gray-600": !v(Z)
            }),
            () => v(le) ? `${v(K).total.toLocaleString()} rows contain "${v(K).x}"; ${v(K).selected.toLocaleString()} (${M(v(K).selected, v(K).total)}) in selection` : `${v(K).total.toLocaleString()} rows contain "${v(K).x}"`
          ]
        ), te(X, U);
      });
      var j = oe(q, 2), W = ne(j), Y = ne(W);
      {
        var G = (X) => {
          var K = yB();
          K.__click = [mB, h, f];
          var V = ne(K);
          {
            var U = (le) => {
              var se = Fn();
              se.nodeValue = "↑ Show up to 10 values", te(le, se);
            }, Z = (le) => {
              var se = Fn();
              se.nodeValue = "↓ Show up to 100 values", te(le, se);
            };
            Fe(V, (le) => {
              v(h) ? le(U) : le(Z, !1);
            });
          }
          ee(K), te(X, K);
        };
        Fe(Y, (X) => {
          (v(h) || v(d).hasOther) && X(G);
        });
      }
      ee(W), ee(j), te($, L);
    };
    Fe(z, ($) => {
      v(d) && $(B);
    });
  }
  ee(R), bl(R, "clientWidth", ($) => H(g, $)), te(t, R), yt(), n();
}
Nr(["click"]);
function _B(t) {
  t.key == "Escape" && t.stopPropagation();
}
var kB = /* @__PURE__ */ _e("<input/>");
function Jk(t, e) {
  mt(e, !0);
  let r = tt(e, "value", 15), n = tt(e, "type", 3, "text"), a = tt(e, "placeholder", 3, ""), o = tt(e, "className", 3, "");
  var l = kB();
  oM(l), l.__keydown = [_B], Ne(() => {
    Q(l, "type", n()), Q(l, "placeholder", a()), Sr(l, 1, `form-input rounded-md py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 ${o() ?? "" ?? ""}`);
  }), hM(l, r), te(t, l), yt();
}
Nr(["keydown"]);
var SB = /* @__PURE__ */ xt('<svg><path fill="currentColor" d="M3.2 5.74a.75.75 0 0 1 1.06-.04L8 9.227L11.74 5.7a.75.75 0 1 1 1.02 1.1l-4.25 4a.75.75 0 0 1-1.02 0l-4.25-4a.75.75 0 0 1-.04-1.06"></path></svg>');
function Qk(t, e) {
  const r = /* @__PURE__ */ bn(e, ["$$slots", "$$events", "$$legacy"]);
  var n = SB();
  ri(n, () => ({ viewBox: "0 0 16 16", width: "1.2em", height: "1.2em", ...r })), te(t, n);
}
var CB = /* @__PURE__ */ xt('<svg><path fill="currentColor" d="M3.2 10.26a.75.75 0 0 0 1.06.04L8 6.773l3.74 3.527a.75.75 0 1 0 1.02-1.1l-4.25-4a.75.75 0 0 0-1.02 0l-4.25 4a.75.75 0 0 0-.04 1.06"></path></svg>');
function e3(t, e) {
  const r = /* @__PURE__ */ bn(e, ["$$slots", "$$events", "$$legacy"]);
  var n = CB();
  ri(n, () => ({ viewBox: "0 0 16 16", width: "1.2em", height: "1.2em", ...r })), te(t, n);
}
var EB = /* @__PURE__ */ xt('<svg><path fill="currentColor" d="M2.75 2a.75.75 0 0 1 .75.75v12.5c0 .69.56 1.25 1.25 1.25h12.5a.75.75 0 0 1 0 1.5H4.75A2.75 2.75 0 0 1 2 15.25V2.75A.75.75 0 0 1 2.75 2M10 7.5a2.5 2.5 0 1 1-5 0a2.5 2.5 0 0 1 5 0m4.5.5a2.5 2.5 0 1 0 0-5a2.5 2.5 0 0 0 0 5m.5 4.5a2.5 2.5 0 1 1-5 0a2.5 2.5 0 0 1 5 0"></path></svg>');
function MB(t, e) {
  const r = /* @__PURE__ */ bn(e, ["$$slots", "$$events", "$$legacy"]);
  var n = EB();
  ri(n, () => ({ viewBox: "0 0 20 20", width: "1.2em", height: "1.2em", ...r })), te(t, n);
}
var RB = /* @__PURE__ */ xt('<svg><path fill="currentColor" d="m2.397 2.554l.073-.084a.75.75 0 0 1 .976-.073l.084.073L8 6.939l4.47-4.47a.75.75 0 1 1 1.06 1.061L9.061 8l4.47 4.47a.75.75 0 0 1 .072.976l-.073.084a.75.75 0 0 1-.976.073l-.084-.073L8 9.061l-4.47 4.47a.75.75 0 0 1-1.06-1.061L6.939 8l-4.47-4.47a.75.75 0 0 1-.072-.976l.073-.084z"></path></svg>');
function fh(t, e) {
  const r = /* @__PURE__ */ bn(e, ["$$slots", "$$events", "$$legacy"]);
  var n = RB();
  ri(n, () => ({ viewBox: "0 0 16 16", width: "1.2em", height: "1.2em", ...r })), te(t, n);
}
var TB = /* @__PURE__ */ xt('<svg><path fill="currentColor" d="M9 1H6a2 2 0 0 0-2 2v2.205a5.5 5.5 0 0 1 4.666 9.791H12a2 2 0 0 0 2-2V6.001h-3.5A1.5 1.5 0 0 1 9 4.5zm4.997 4h-3.498a.5.5 0 0 1-.5-.5V1h.01zM10 10.5a4.5 4.5 0 1 1-9 0a4.5 4.5 0 0 1 9 0m-4.854 2.353l.003.003a.5.5 0 0 0 .348.144h.006a.5.5 0 0 0 .35-.146l2-2a.5.5 0 0 0-.707-.708L6 11.293V8.5a.5.5 0 0 0-1 0v2.793l-1.146-1.147a.5.5 0 0 0-.708.708z"></path></svg>');
function Hx(t, e) {
  const r = /* @__PURE__ */ bn(e, ["$$slots", "$$events", "$$legacy"]);
  var n = TB();
  ri(n, () => ({ viewBox: "0 0 16 16", width: "1.2em", height: "1.2em", ...r })), te(t, n);
}
var NB = /* @__PURE__ */ xt('<svg><path fill="currentColor" d="M10.529 1.764a2.621 2.621 0 1 1 3.707 3.707l-.779.779L9.75 2.543zM9.043 3.25L2.657 9.636a2.96 2.96 0 0 0-.772 1.354l-.87 3.386a.5.5 0 0 0 .61.608l3.385-.869a2.95 2.95 0 0 0 1.354-.772l6.386-6.386z"></path></svg>');
function t3(t, e) {
  const r = /* @__PURE__ */ bn(e, ["$$slots", "$$events", "$$legacy"]);
  var n = NB();
  ri(n, () => ({ viewBox: "0 0 16 16", width: "1.2em", height: "1.2em", ...r })), te(t, n);
}
var FB = /* @__PURE__ */ xt('<svg><path fill="currentColor" d="M2 6a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v7a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3zm3-2a2 2 0 0 0-2 2v5h14V6a2 2 0 0 0-2-2z"></path></svg>');
function PB(t, e) {
  const r = /* @__PURE__ */ bn(e, ["$$slots", "$$events", "$$legacy"]);
  var n = FB();
  ri(n, () => ({ viewBox: "0 0 20 20", width: "1.2em", height: "1.2em", ...r })), te(t, n);
}
var zB = /* @__PURE__ */ xt('<svg><path fill="currentColor" d="M15 3a3 3 0 0 1 3 3v7a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3zM5 4a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h6.5V4z"></path></svg>');
function DB(t, e) {
  const r = /* @__PURE__ */ bn(e, ["$$slots", "$$events", "$$legacy"]);
  var n = zB();
  ri(n, () => ({ viewBox: "0 0 20 20", width: "1.2em", height: "1.2em", ...r })), te(t, n);
}
var OB = /* @__PURE__ */ xt('<svg><path fill="currentColor" d="M9.823 10.883a5.5 5.5 0 1 1 1.06-1.06l2.897 2.897a.75.75 0 1 1-1.06 1.06zM10.5 6.5a4 4 0 1 0-8 0a4 4 0 0 0 8 0"></path></svg>');
function LB(t, e) {
  const r = /* @__PURE__ */ bn(e, ["$$slots", "$$events", "$$legacy"]);
  var n = OB();
  ri(n, () => ({ viewBox: "0 0 16 16", width: "1.2em", height: "1.2em", ...r })), te(t, n);
}
var BB = /* @__PURE__ */ xt('<svg><path fill="currentColor" d="M2.267 6.153A6 6 0 0 1 3.53 3.98a.36.36 0 0 1 .382-.095l1.36.484a.71.71 0 0 0 .935-.538l.26-1.416a.35.35 0 0 1 .274-.282a6.1 6.1 0 0 1 2.52 0c.14.03.248.141.274.282l.26 1.416a.708.708 0 0 0 .935.538l1.36-.484a.36.36 0 0 1 .382.095a6 6 0 0 1 1.262 2.173a.35.35 0 0 1-.108.378l-1.102.931a.703.703 0 0 0 0 1.076l1.102.931c.11.093.152.242.108.378a6 6 0 0 1-1.262 2.173a.36.36 0 0 1-.382.095l-1.36-.484a.71.71 0 0 0-.935.538l-.26 1.416a.35.35 0 0 1-.275.282a6.1 6.1 0 0 1-2.519 0a.35.35 0 0 1-.275-.282l-.259-1.416a.708.708 0 0 0-.935-.538l-1.36.484a.36.36 0 0 1-.382-.095a6 6 0 0 1-1.262-2.173a.35.35 0 0 1 .108-.378l1.102-.931a.704.704 0 0 0 0-1.076l-1.102-.931a.35.35 0 0 1-.108-.378M6.25 8a1.75 1.75 0 1 0 3.5 0a1.75 1.75 0 0 0-3.5 0"></path></svg>');
function AB(t, e) {
  const r = /* @__PURE__ */ bn(e, ["$$slots", "$$events", "$$legacy"]);
  var n = BB();
  ri(n, () => ({ viewBox: "0 0 16 16", width: "1.2em", height: "1.2em", ...r })), te(t, n);
}
var qB = /* @__PURE__ */ xt('<svg><path fill="currentColor" d="M7.456 2a6 6 0 1 1-5.406 8.605a.5.5 0 0 1 .36-.71c1.276-.231 3.278-.937 4.078-3.07c.563-1.5.512-3.015.283-4.23a.5.5 0 0 1 .475-.591Q7.35 2 7.456 2"></path></svg>');
function jB(t, e) {
  const r = /* @__PURE__ */ bn(e, ["$$slots", "$$events", "$$legacy"]);
  var n = qB();
  ri(n, () => ({ viewBox: "0 0 16 16", width: "1.2em", height: "1.2em", ...r })), te(t, n);
}
var $B = /* @__PURE__ */ xt('<svg><path fill="currentColor" d="M8 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-1 0v-1A.5.5 0 0 1 8 1m0 10a3 3 0 1 0 0-6a3 3 0 0 0 0 6m6.5-2.5a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1zM8 13a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-1 0v-1A.5.5 0 0 1 8 13M2.5 8.5a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1zm.646-5.354a.5.5 0 0 1 .708 0l1 1a.5.5 0 1 1-.708.708l-1-1a.5.5 0 0 1 0-.708m.708 9.708a.5.5 0 1 1-.708-.707l1-1a.5.5 0 0 1 .708.707zm9-9.708a.5.5 0 0 0-.708 0l-1 1a.5.5 0 0 0 .708.708l1-1a.5.5 0 0 0 0-.708m-.708 9.708a.5.5 0 0 0 .708-.707l-1-1a.5.5 0 0 0-.708.707z"></path></svg>');
function UB(t, e) {
  const r = /* @__PURE__ */ bn(e, ["$$slots", "$$events", "$$legacy"]);
  var n = $B();
  ri(n, () => ({ viewBox: "0 0 16 16", width: "1.2em", height: "1.2em", ...r })), te(t, n);
}
var IB = (t, e, r, n) => {
  t.shiftKey ? H(e, v(r) ? v(e).filter((a) => a != v(n).predicate) : [...v(e), v(n).predicate]) : v(r) ? H(e, []) : H(e, [v(n).predicate]);
}, HB = /* @__PURE__ */ _e('<div><button class="flex-1 overflow-hidden text-left"><div class="text-ellipsis overflow-hidden w-full"> </div> <div class="text-ellipsis overflow-hidden w-full"><code class="text-xs whitespace-nowrap"> </code></div></button> <div class="flex-none flex gap-1"><!> <!></div></div>'), WB = (t, e, r) => {
  H(e, !0), H(r, null);
}, GB = (t, e, r) => H(e, r()?.trim() ?? "", !0), VB = /* @__PURE__ */ _e('<div class="mt-4"><!> <div class="text-slate-500 dark:text-slate-400 text-sm mb-1">SQL Predicate</div> <!> <div class="flex gap-2"><!> <!> <div class="flex-1"></div> <button class="text-slate-400 dark:text-slate-500 hover:text-slate-800 dark:hover:text-slate-200">Current Predicate</button></div></div>'), XB = /* @__PURE__ */ _e('<div><div class="flex flex-col gap-1"><!> <button class="text-left text-slate-400 dark:text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 whitespace-nowrap text-ellipsis w-full overflow-hidden">+ Add Selection</button></div> <!></div>');
function YB(t, e) {
  mt(e, !0);
  const r = yr.coordinator;
  let n = /* @__PURE__ */ me([]), a = /* @__PURE__ */ me([]), o = /* @__PURE__ */ me(!1), l = /* @__PURE__ */ me(null), u = /* @__PURE__ */ me(""), c = /* @__PURE__ */ me("");
  function f() {
    H(o, !1), H(l, null), H(c, ""), H(u, "");
  }
  function h(k) {
    H(n, k), H(a, v(a).filter((T) => v(n).find((E) => E.predicate == T) != null));
  }
  async function d() {
    let k = v(c).trim();
    k == "" && (k = "Selection");
    let T = v(u).trim();
    if (T == "")
      return null;
    try {
      await r.query(N.Query.from(e.table).select({ count: N.count() }).where(T));
    } catch (E) {
      return alert(E.toString()), null;
    }
    return { name: k, predicate: T };
  }
  function g() {
    let k = e.filter.predicate(null);
    return k == null || k.length == 0 ? null : typeof k == "string" ? k : k.map((T) => T.toString()).join(`
AND `);
  }
  et(() => {
    let k = kC({
      coordinator: r,
      selection: e.filter,
      query: () => N.sql`SELECT 1`
    });
    return yn(() => {
      if (v(a).length == 0)
        e.filter.update({
          source: k,
          clients: /* @__PURE__ */ new Set([k]),
          predicate: null,
          value: null
        });
      else {
        let T = v(a).map((E) => "(" + E + ")").join(" OR ");
        e.filter.update({
          source: k,
          clients: /* @__PURE__ */ new Set([k]),
          predicate: N.asVerbatim(T),
          value: T
        });
      }
    }), k.reset = () => H(a, []), () => {
      k.destroy();
    };
  }), et(() => Il(
    e.stateStore,
    () => ({
      items: v(n),
      selectedPredicates: v(a)
    }),
    (k) => {
      H(n, k.items ?? []), H(a, k.selectedPredicates ?? []);
    }
  ));
  var m = XB(), y = ne(m), w = ne(y);
  Xt(w, 17, () => v(n), or, (k, T) => {
    var E = HB();
    const M = /* @__PURE__ */ ie(() => v(a).indexOf(v(T).predicate) >= 0);
    let R;
    var z = ne(E);
    z.__click = [IB, a, M, T];
    var B = ne(z), $ = ne(B, !0);
    ee(B);
    var L = oe(B, 2), q = ne(L), j = ne(q, !0);
    ee(q), ee(L), ee(z);
    var W = oe(z, 2), Y = ne(W);
    Oi(Y, {
      get icon() {
        return t3;
      },
      style: "plotCell",
      onClick: () => {
        H(l, v(T)), H(u, v(T).predicate, !0), H(c, v(T).name, !0), H(o, !0);
      }
    });
    var G = oe(Y, 2);
    Oi(G, {
      get icon() {
        return fh;
      },
      style: "plotCell",
      onClick: () => {
        h(v(n).filter((X) => X !== v(T)));
      }
    }), ee(W), ee(E), Ne(
      (X) => {
        R = Sr(E, 1, "flex gap-4 w-full bg-white dark:bg-slate-800 p-2 rounded-md border border-slate-200 dark:border-slate-600 select-none", null, R, X), it($, v(T).name), Q(q, "title", v(T).predicate), it(j, v(T).predicate);
      },
      [
        () => ({
          "!bg-blue-100": v(M),
          "!border-blue-400": v(M),
          "dark:!bg-blue-800": v(M),
          "dark:!border-blue-600": v(M)
        })
      ]
    ), te(k, E);
  });
  var x = oe(w, 2);
  x.__click = [WB, o, l], ee(y);
  var _ = oe(y, 2);
  {
    var S = (k) => {
      var T = VB(), E = ne(T);
      Jk(E, {
        placeholder: "name",
        className: "w-full mb-2",
        get value() {
          return v(c);
        },
        set value(j) {
          H(c, j, !0);
        }
      });
      var M = oe(E, 4);
      qg(M, {
        language: "sql",
        className: "!h-24 mb-2",
        get value() {
          return v(u);
        },
        onChange: (j) => H(u, j, !0)
      });
      var R = oe(M, 2), z = ne(R);
      {
        var B = (j) => {
          Oi(j, {
            label: "Update",
            onClick: async () => {
              let W = await d();
              W && (h(v(n).map((Y) => Y === v(l) ? W : Y)), f());
            }
          });
        }, $ = (j) => {
          Oi(j, {
            label: "Add",
            onClick: async () => {
              let W = await d();
              W && (h([...v(n), W]), f());
            }
          });
        };
        Fe(z, (j) => {
          v(l) != null ? j(B) : j($, !1);
        });
      }
      var L = oe(z, 2);
      Oi(L, {
        label: "Cancel",
        onClick: () => {
          H(l, null), H(o, !1);
        }
      });
      var q = oe(L, 4);
      q.__click = [GB, u, g], ee(R), ee(T), te(k, T);
    };
    Fe(_, (k) => {
      v(o) && k(S);
    });
  }
  ee(m), te(t, m), yt();
}
Nr(["click"]);
function ZB(t, e) {
  let r = e.mark?.plot?.element;
  return r == null ? !1 : t?.contains(r) ?? !1;
}
async function KB(t, e, r, n) {
  if (r == null || e == null)
    return null;
  let a = /* @__PURE__ */ new Map();
  for (let f in n)
    a.set(f, n[f]);
  let o = mp(r), l = TC({ coordinator: t }), c = (await NC(o, { params: a, api: l })).element;
  return e.appendChild(c), () => {
    for (let f in n) {
      let h = n[f];
      if (_v(h))
        for (let d of h.clauses)
          ZB(e, d.source) && (d.source?.reset(), h.update({ ...d, value: null, predicate: null }));
    }
    c.remove();
  };
}
var JB = /* @__PURE__ */ _e('<div class="w-full"></div>');
function QB(t, e) {
  mt(e, !0);
  const r = yr.coordinator;
  let n, a = /* @__PURE__ */ me(100);
  const o = {
    continuousColorScheme: gu.value("YlGnBu"),
    continuousColorSchemeZero: gu.value("black"),
    markColor: gu.value("black"),
    markColorFade: gu.value("black"),
    containerWidth: gu.value(100)
  };
  yn(() => yr.darkMode.subscribe((u) => {
    let c = u ? sn.dark : sn.light;
    o.continuousColorScheme.update(c.continuousColorScheme), o.continuousColorSchemeZero.update(c.continuousColorSchemeAtZero), o.markColor.update(c.markColor), o.markColorFade.update(c.markColorFade);
  })), yn(() => {
    o.containerWidth.update(v(a));
  }), bc(() => {
    et(() => {
      let u = null;
      async function c(...f) {
        u = await KB(...f);
      }
      return c(r, n, e.spec, { ...o, ...e.params }), () => {
        u?.();
      };
    });
  });
  var l = JB();
  Ii(l, (u) => n = u, () => n), bl(l, "clientWidth", (u) => H(a, u)), te(t, l), yt();
}
var eA = /* @__PURE__ */ _e('<div>An error occurred in this chart. Please check and <button class="underline">try again</button>. <div class="text-xs"> </div></div>');
function r3(t, e) {
  mt(e, !0);
  const r = {
    BoxPlot: PL,
    CountPlot: HL,
    Histogram: ZL,
    Histogram2D: rB,
    HistogramStack: uB,
    ListCountPlot: wB,
    SelectionList: YB
  };
  var n = dr(), a = Ie(n);
  bE(a, { failed: (l, u = Ot, c = Ot) => {
    var f = eA(), h = oe(ne(f));
    h.__click = function(...m) {
      c()?.apply(this, m);
    };
    var d = oe(h, 2), g = ne(d, !0);
    ee(d), ee(f), Ne((m) => it(g, m), [() => u()?.toString() ?? "unknown"]), te(l, f);
  } }, (l) => {
    var u = dr(), c = Ie(u);
    {
      var f = (d) => {
        var g = dr();
        const m = /* @__PURE__ */ ie(() => r[e.spec.component]);
        var y = Ie(g);
        qp(y, () => v(m), (w, x) => {
          x(w, wM(() => e.spec.props, {
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
        }), te(d, g);
      }, h = (d) => {
        {
          let g = /* @__PURE__ */ ie(() => ({ brush: e.filter }));
          QB(d, {
            get spec() {
              return e.spec;
            },
            get params() {
              return v(g);
            }
          });
        }
      };
      Fe(c, (d) => {
        "component" in e.spec ? d(f) : d(h, !1);
      });
    }
    te(l, u);
  }), te(t, n), yt();
}
Nr(["click"]);
function tA(t, e, r, n) {
  let a = v(e).create(r());
  a && n.onCreate?.({ id: Jo(), title: a.title, spec: a.spec });
}
var rA = (t, e, r) => {
  H(e, v(r));
}, nA = /* @__PURE__ */ _e("<button><!></button>"), iA = /* @__PURE__ */ _e('<span class="text-slate-500 dark:text-slate-400"> </span> <!>', 1), aA = /* @__PURE__ */ _e("<!> <!>", 1), oA = /* @__PURE__ */ _e('<span class="text-slate-500 dark:text-slate-400">Preview</span> <!>', 1), lA = /* @__PURE__ */ _e("<div> </div>"), sA = /* @__PURE__ */ _e('<div class="flex flex-col gap-2"><div class="flex gap-2"></div> <div> </div> <!> <button>Confirm</button> <!> <!></div>');
function uA(t, e) {
  mt(e, !0);
  let r = tt(e, "columns", 19, () => []), n = [
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
      create: ({ x: M }) => {
        if (M != null)
          return { title: M.name, spec: Gf(M) };
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
      create: ({ x: M }) => {
        if (M != null)
          return { title: M.name, spec: Yk(M) };
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
      create: ({ x: M, y: R }) => {
        if (!(M == null || R == null))
          return {
            title: `${M.name} vs. ${R.name}`,
            spec: SL(M, R)
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
      create: ({ x: M, y: R }) => {
        if (!(M == null || R == null))
          return {
            title: `${M.name} by ${R.name}`,
            spec: kL(M, R)
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
      create: ({ x: M, y: R }) => {
        if (!(M == null || R == null))
          return { title: `${M.name} vs. ${R.name}`, spec: CL(M, R) };
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
      create: ({ spec: M }) => {
        if (typeof M != "string" || M.trim() == "")
          return;
        let R = JSON.parse(M);
        return mp(R), { title: "Mosaic Chart", spec: R };
      }
    }
  ], a = /* @__PURE__ */ me(n[0]), o = /* @__PURE__ */ me(gi({})), l = /* @__PURE__ */ me(!1), u = /* @__PURE__ */ me(null);
  et(() => {
    v(a), H(o, {}, !0);
  }), et(() => {
    try {
      let M = v(a).create(c());
      H(l, M != null), H(u, v(a).preview ? M?.spec ?? null : null, !0);
    } catch (M) {
      H(l, M.toString(), !0);
    }
  });
  function c() {
    let M = { ...v(o) };
    for (let R of v(a).ui)
      R.field && (M[R.field.key] = f(M[R.field.key]));
    return M;
  }
  function f(M) {
    let R = r().find((z) => z.name == M);
    if (R == null || R.jsType == null)
      return null;
    switch (R.jsType) {
      case "number":
        return { name: R.name, type: "continuous" };
      case "string":
        return { name: R.name, type: "discrete" };
      case "string[]":
        return { name: R.name, type: "discrete[]" };
      default:
        return null;
    }
  }
  function h(M) {
    return M == null ? r().filter((R) => R.jsType != null) : r().filter((R) => R.jsType != null && M.indexOf(R.jsType) >= 0);
  }
  var d = sA(), g = ne(d);
  Xt(g, 21, () => n, or, (M, R) => {
    var z = nA();
    const B = /* @__PURE__ */ ie(() => v(a) == v(R));
    z.__click = [rA, a, R];
    let $;
    var L = ne(z);
    MD(L, {
      get type() {
        return v(R).icon;
      }
    }), ee(z), Ne(
      (q) => {
        Q(z, "title", v(R).description), $ = Sr(z, 1, "rounded-md border border-slate-300 dark:border-slate-600", null, $, q);
      },
      [
        () => ({
          "!border-slate-500": v(B),
          "dark:!border-slate-400": v(B),
          "!bg-slate-300": v(B),
          "dark:!bg-slate-600": v(B)
        })
      ]
    ), te(M, z);
  }), ee(g);
  var m = oe(g, 2), y = ne(m, !0);
  ee(m);
  var w = oe(m, 2);
  Xt(w, 17, () => v(a).ui, or, (M, R) => {
    var z = aA(), B = Ie(z);
    {
      var $ = (j) => {
        var W = iA();
        const Y = /* @__PURE__ */ ie(() => v(R).field.key);
        var G = Ie(W), X = ne(G, !0);
        ee(G);
        var K = oe(G, 2);
        {
          let V = /* @__PURE__ */ ie(() => v(o)[v(Y)] ?? null), U = /* @__PURE__ */ ie(() => h(v(R).field.types).map((Z) => ({ value: Z.name, label: `${Z.name} (${Z.type})` })));
          Ko(K, {
            get value() {
              return v(V);
            },
            onChange: (Z) => v(o)[v(Y)] = Z,
            placeholder: "(select field)",
            class: "w-full",
            get options() {
              return v(U);
            }
          });
        }
        Ne(() => it(X, v(R).field.label)), te(j, W);
      };
      Fe(B, (j) => {
        v(R).field && j($);
      });
    }
    var L = oe(B, 2);
    {
      var q = (j) => {
        const W = /* @__PURE__ */ ie(() => v(R).text.key);
        qg(j, {
          language: "json",
          get value() {
            return v(o)[v(W)];
          },
          onChange: (Y) => v(o)[v(W)] = Y
        });
      };
      Fe(L, (j) => {
        v(R).text && j(q);
      });
    }
    te(M, z);
  });
  var x = oe(w, 2);
  let _;
  x.__click = [tA, a, c, e];
  var S = oe(x, 2);
  {
    var k = (M) => {
      var R = oA(), z = oe(Ie(R), 2);
      Id(z, () => v(u), (B) => {
        r3(B, {
          get table() {
            return e.table;
          },
          get filter() {
            return e.filter;
          },
          get spec() {
            return v(u);
          }
        });
      }), te(M, R);
    };
    Fe(S, (M) => {
      v(u) != null && M(k);
    });
  }
  var T = oe(S, 2);
  {
    var E = (M) => {
      var R = lA(), z = ne(R, !0);
      ee(R), Ne(() => it(z, v(l))), te(M, R);
    };
    Fe(T, (M) => {
      typeof v(l) == "string" && v(l).trim() != "" && M(E);
    });
  }
  ee(d), Ne(
    (M) => {
      it(y, v(a).description), _ = Sr(x, 1, "px-2 mt-2 h-8 w-24 rounded-md text-white text-sm", null, _, M), x.disabled = v(l) !== !0;
    },
    [
      () => ({
        "bg-blue-500": v(l) === !0,
        "bg-gray-400": v(l) !== !0,
        "dark:bg-gray-600": v(l) !== !0
      })
    ]
  ), te(t, d), yt();
}
Nr(["click"]);
function cA(t, e, r, n, a) {
  let o = e(v(r));
  if (o != null) {
    H(n, o, !0);
    return;
  }
  a.onConfirm(JSON.parse(v(r)));
}
function fA(t, e) {
  e.onCancel();
}
var dA = /* @__PURE__ */ _e('<div class="pt-2"><!> <div class="flex gap-1 items-center"><div class="flex-1"><a class="underline pr-2" href="https://uwdata.github.io/mosaic/api/spec/format.html" target="_blank">Mosaic Spec Reference</a></div> <button class="px-2 h-8 rounded-md bg-blue-500 text-white text-sm">Confirm</button> <button class="px-2 h-8 rounded-md bg-slate-500 text-white text-sm">Cancel</button></div> <div> </div></div>');
function hA(t, e) {
  mt(e, !0);
  let r = /* @__PURE__ */ me(gi(JSON.stringify(e.spec, null, 2))), n = /* @__PURE__ */ me("");
  et(() => {
    H(n, a(v(r)) ?? "", !0);
  });
  function a(g) {
    try {
      let m = JSON.parse(g);
      "component" in m || mp(m);
    } catch (m) {
      return m.toString();
    }
    return null;
  }
  var o = dA(), l = ne(o);
  qg(l, {
    language: "json",
    get value() {
      return v(r);
    },
    onChange: (g) => H(r, g, !0),
    className: "mb-2"
  });
  var u = oe(l, 2), c = oe(ne(u), 2);
  c.__click = [cA, a, r, n, e];
  var f = oe(c, 2);
  f.__click = [fA, e], ee(u);
  var h = oe(u, 2), d = ne(h, !0);
  ee(h), ee(o), Ne(() => it(d, v(n))), te(t, o), yt();
}
Nr(["click"]);
var vA = (t, e) => H(e, !v(e)), pA = /* @__PURE__ */ _e('<div class="text-sm pr-0.5"><!></div>'), gA = /* @__PURE__ */ _e('<div class="text-sm pr-0.5"><!></div>'), mA = /* @__PURE__ */ _e("<div><!></div>"), yA = /* @__PURE__ */ _e("<!> <!>", 1), bA = /* @__PURE__ */ _e('<div class="group"><div class="px-2 pt-2 flex items-center"><button class="font-mono font-medium py-1 text-left flex flex-1 mr-2 overflow-hidden items-center"><!> <div class="flex-1 whitespace-nowrap overflow-hidden text-ellipsis"> </div></button> <div class="flex-none flex gap-0.5 opacity-0 group-hover:opacity-100"><!> <!></div></div> <div><div class="overflow-hidden px-2 pb-2"><div class="pt-2"></div> <!></div></div></div>');
function xA(t, e) {
  mt(e, !0);
  let r = /* @__PURE__ */ me(!1), n = /* @__PURE__ */ me(!0);
  var a = bA(), o = ne(a), l = ne(o);
  l.__click = [vA, n];
  var u = ne(l);
  {
    var c = (M) => {
      var R = pA(), z = ne(R);
      e3(z, {}), ee(R), te(M, R);
    }, f = (M) => {
      var R = gA(), z = ne(R);
      Qk(z, {}), ee(R), te(M, R);
    };
    Fe(u, (M) => {
      v(n) ? M(c) : M(f, !1);
    });
  }
  var h = oe(u, 2), d = ne(h, !0);
  ee(h), ee(l);
  var g = oe(l, 2), m = ne(g);
  {
    var y = (M) => {
      Oi(M, {
        get icon() {
          return t3;
        },
        order: 1,
        style: "plotCell",
        title: "Edit spec",
        onClick: () => H(r, !0)
      });
    };
    Fe(m, (M) => {
      e.plot.spec != null && !v(r) && M(y);
    });
  }
  var w = oe(m, 2);
  Vu(w, () => e.buttons ?? Ot), ee(g), ee(o);
  var x = oe(o, 2);
  let _;
  var S = ne(x), k = oe(ne(S), 2);
  {
    var T = (M) => {
      var R = yA(), z = Ie(R);
      r3(z, {
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
      var B = oe(z, 2);
      {
        var $ = (L) => {
          var q = mA(), j = ne(q);
          hA(j, {
            get spec() {
              return e.plot.spec;
            },
            onConfirm: (W) => {
              H(r, !1), e.onChange?.({ ...e.plot, spec: W });
            },
            onCancel: () => {
              H(r, !1);
            }
          }), ee(q), td(3, q, () => nd), te(L, q);
        };
        Fe(B, (L) => {
          v(r) && L($);
        });
      }
      te(M, R);
    }, E = (M) => {
      uA(M, {
        get table() {
          return e.table;
        },
        get filter() {
          return e.filter;
        },
        get columns() {
          return e.columns;
        },
        onCreate: (R) => {
          e.onChange?.(R);
        }
      });
    };
    Fe(k, (M) => {
      e.plot.spec != null ? M(T) : M(E, !1);
    });
  }
  ee(S), ee(x), ee(a), Ne(
    (M) => {
      it(d, e.plot.title), _ = nt(x, "", _, M);
    },
    [
      () => ({
        display: "grid",
        "grid-template-rows": v(n) ? "1fr" : "0fr",
        transition: "grid-template-rows 300ms ease-in-out"
      })
    ]
  ), te(t, a), yt();
}
Nr(["click"]);
var wA = (t, e) => e(), _A = /* @__PURE__ */ _e("<!> <!> <!>", 1), kA = /* @__PURE__ */ _e('<div class="flex-none bg-slate-100 dark:bg-slate-700 rounded-md"><!></div>'), SA = /* @__PURE__ */ _e('<div><button class="flex-none bg-slate-100 dark:bg-slate-700 rounded-md p-2 text-slate-500 hover:bg-white hover:text-slate-900 dark:hover:bg-slate-600 dark:hover:text-slate-100 select-none focus-visible:outline-2 outline-blue-600 -outline-offset-2">+ Add Chart</button> <!></div>');
function CA(t, e) {
  mt(e, !0);
  let r = tt(e, "plots", 15), n = tt(e, "layout", 3, "sidebar");
  function a() {
    r([
      { id: Jo(), title: "New Chart", spec: null },
      ...r()
    ]);
  }
  function o(m) {
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
      let _ = x[w - 1];
      x[w - 1] = m, x[w] = _;
    }
    if (y == "down" && w < r().length - 1) {
      let _ = x[w + 1];
      x[w + 1] = m, x[w] = _;
    }
    r(x);
  }
  var c = SA();
  let f;
  var h = ne(c);
  h.__click = [wA, a];
  let d;
  var g = oe(h, 2);
  Xt(g, 26, r, (m) => m, (m, y, w) => {
    var x = kA();
    let _;
    var S = ne(x);
    {
      const k = (E) => {
        var M = _A(), R = Ie(M);
        {
          var z = (q) => {
            Oi(q, {
              get icon() {
                return e3;
              },
              title: "Move up",
              style: "plotCell",
              order: 3,
              onClick: () => u(y, "up")
            });
          };
          Fe(R, (q) => {
            v(w) > 0 && q(z);
          });
        }
        var B = oe(R, 2);
        {
          var $ = (q) => {
            Oi(q, {
              get icon() {
                return Qk;
              },
              title: "Move down",
              style: "plotCell",
              order: 4,
              onClick: () => u(y, "down")
            });
          };
          Fe(B, (q) => {
            v(w) < r().length - 1 && q($);
          });
        }
        var L = oe(B, 2);
        Oi(L, {
          get icon() {
            return fh;
          },
          style: "plotCellClose",
          title: "Close",
          order: 5,
          onClick: () => o(y)
        }), te(E, M);
      };
      let T = /* @__PURE__ */ ie(() => e.stateStores?.store(y.id));
      xA(S, {
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
        onChange: (E) => l(y, E),
        get stateStore() {
          return v(T);
        },
        buttons: k,
        $$slots: { buttons: !0 }
      });
    }
    ee(x), Ne((k) => _ = nt(x, "", _, k), [() => ({ width: n() == "full" ? "400px" : null })]), dM(x, () => Gz, () => ({ duration: 300 })), td(2, x, () => nd), te(m, x);
  }), ee(c), Ne(
    (m, y) => {
      f = Sr(c, 1, "flex gap-2", null, f, m), d = nt(h, "", d, y);
    },
    [
      () => ({
        "flex-col": n() == "sidebar",
        "flex-row": n() == "full",
        "flex-wrap": n() == "full"
      }),
      () => ({ width: n() == "full" ? "400px" : null })
    ]
  ), te(t, c), yt();
}
Nr(["click"]);
var EA = /* @__PURE__ */ _e('<div> <span class="text-slate-500"> </span></div>');
function MA(t, e) {
  mt(e, !0);
  const r = yr.coordinator;
  let n = /* @__PURE__ */ me(null), a = /* @__PURE__ */ me(null);
  yn(() => {
    let f = { coordinator: r, table: e.table, filter: e.filter };
    H(n, null), H(a, null), f.coordinator.query(Ps.from(f.table).select({ count: ms`COUNT(*)::INT` })).then((d) => {
      H(n, d.getChild("count").get(0), !0);
    });
    let h = Ul({
      coordinator: f.coordinator,
      selection: f.filter,
      query: (d) => Ps.from(f.table).select({ count: ms`COUNT(*)::INT` }).where(d),
      queryResult: (d) => {
        H(a, d.getChild("count").get(0), !0);
      }
    });
    return () => {
      h.destroy();
    };
  });
  var o = EA(), l = ne(o), u = oe(l), c = ne(u);
  ee(u), ee(o), Ne(
    (f, h) => {
      it(l, `${f ?? ""} `), it(c, `/ ${h ?? ""} points`);
    },
    [
      () => v(a)?.toLocaleString() ?? "",
      () => v(n)?.toLocaleString() ?? ""
    ]
  ), te(t, o), yt();
}
function RA(t) {
  return t && t.__esModule && Object.prototype.hasOwnProperty.call(t, "default") ? t.default : t;
}
var Vf = { exports: {} };
/*!***************************************************
* mark.js v8.11.1
* https://markjs.io/
* Copyright (c) 2014–2018, Julian Kühnel
* Released under the MIT license https://git.io/vwTVl
*****************************************************/
var TA = Vf.exports, Wx;
function NA() {
  return Wx || (Wx = 1, function(t, e) {
    (function(r, n) {
      t.exports = n();
    })(TA, function() {
      var r = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(f) {
        return typeof f;
      } : function(f) {
        return f && typeof Symbol == "function" && f.constructor === Symbol && f !== Symbol.prototype ? "symbol" : typeof f;
      }, n = function(f, h) {
        if (!(f instanceof h))
          throw new TypeError("Cannot call a class as a function");
      }, a = /* @__PURE__ */ function() {
        function f(h, d) {
          for (var g = 0; g < d.length; g++) {
            var m = d[g];
            m.enumerable = m.enumerable || !1, m.configurable = !0, "value" in m && (m.writable = !0), Object.defineProperty(h, m.key, m);
          }
        }
        return function(h, d, g) {
          return d && f(h.prototype, d), g && f(h, g), h;
        };
      }(), o = Object.assign || function(f) {
        for (var h = 1; h < arguments.length; h++) {
          var d = arguments[h];
          for (var g in d)
            Object.prototype.hasOwnProperty.call(d, g) && (f[g] = d[g]);
        }
        return f;
      }, l = function() {
        function f(h) {
          var d = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : !0, g = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : [], m = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : 5e3;
          n(this, f), this.ctx = h, this.iframes = d, this.exclude = g, this.iframesTimeout = m;
        }
        return a(f, [{
          key: "getContexts",
          value: function() {
            var d = void 0, g = [];
            return typeof this.ctx > "u" || !this.ctx ? d = [] : NodeList.prototype.isPrototypeOf(this.ctx) ? d = Array.prototype.slice.call(this.ctx) : Array.isArray(this.ctx) ? d = this.ctx : typeof this.ctx == "string" ? d = Array.prototype.slice.call(document.querySelectorAll(this.ctx)) : d = [this.ctx], d.forEach(function(m) {
              var y = g.filter(function(w) {
                return w.contains(m);
              }).length > 0;
              g.indexOf(m) === -1 && !y && g.push(m);
            }), g;
          }
        }, {
          key: "getIframeContents",
          value: function(d, g) {
            var m = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : function() {
            }, y = void 0;
            try {
              var w = d.contentWindow;
              if (y = w.document, !w || !y)
                throw new Error("iframe inaccessible");
            } catch {
              m();
            }
            y && g(y);
          }
        }, {
          key: "isIframeBlank",
          value: function(d) {
            var g = "about:blank", m = d.getAttribute("src").trim(), y = d.contentWindow.location.href;
            return y === g && m !== g && m;
          }
        }, {
          key: "observeIframeLoad",
          value: function(d, g, m) {
            var y = this, w = !1, x = null, _ = function S() {
              if (!w) {
                w = !0, clearTimeout(x);
                try {
                  y.isIframeBlank(d) || (d.removeEventListener("load", S), y.getIframeContents(d, g, m));
                } catch {
                  m();
                }
              }
            };
            d.addEventListener("load", _), x = setTimeout(_, this.iframesTimeout);
          }
        }, {
          key: "onIframeReady",
          value: function(d, g, m) {
            try {
              d.contentWindow.document.readyState === "complete" ? this.isIframeBlank(d) ? this.observeIframeLoad(d, g, m) : this.getIframeContents(d, g, m) : this.observeIframeLoad(d, g, m);
            } catch {
              m();
            }
          }
        }, {
          key: "waitForIframes",
          value: function(d, g) {
            var m = this, y = 0;
            this.forEachIframe(d, function() {
              return !0;
            }, function(w) {
              y++, m.waitForIframes(w.querySelector("html"), function() {
                --y || g();
              });
            }, function(w) {
              w || g();
            });
          }
        }, {
          key: "forEachIframe",
          value: function(d, g, m) {
            var y = this, w = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : function() {
            }, x = d.querySelectorAll("iframe"), _ = x.length, S = 0;
            x = Array.prototype.slice.call(x);
            var k = function() {
              --_ <= 0 && w(S);
            };
            _ || k(), x.forEach(function(T) {
              f.matches(T, y.exclude) ? k() : y.onIframeReady(T, function(E) {
                g(T) && (S++, m(E)), k();
              }, k);
            });
          }
        }, {
          key: "createIterator",
          value: function(d, g, m) {
            return document.createNodeIterator(d, g, m, !1);
          }
        }, {
          key: "createInstanceOnIframe",
          value: function(d) {
            return new f(d.querySelector("html"), this.iframes);
          }
        }, {
          key: "compareNodeIframe",
          value: function(d, g, m) {
            var y = d.compareDocumentPosition(m), w = Node.DOCUMENT_POSITION_PRECEDING;
            if (y & w)
              if (g !== null) {
                var x = g.compareDocumentPosition(m), _ = Node.DOCUMENT_POSITION_FOLLOWING;
                if (x & _)
                  return !0;
              } else
                return !0;
            return !1;
          }
        }, {
          key: "getIteratorNode",
          value: function(d) {
            var g = d.previousNode(), m = void 0;
            return g === null ? m = d.nextNode() : m = d.nextNode() && d.nextNode(), {
              prevNode: g,
              node: m
            };
          }
        }, {
          key: "checkIframeFilter",
          value: function(d, g, m, y) {
            var w = !1, x = !1;
            return y.forEach(function(_, S) {
              _.val === m && (w = S, x = _.handled);
            }), this.compareNodeIframe(d, g, m) ? (w === !1 && !x ? y.push({
              val: m,
              handled: !0
            }) : w !== !1 && !x && (y[w].handled = !0), !0) : (w === !1 && y.push({
              val: m,
              handled: !1
            }), !1);
          }
        }, {
          key: "handleOpenIframes",
          value: function(d, g, m, y) {
            var w = this;
            d.forEach(function(x) {
              x.handled || w.getIframeContents(x.val, function(_) {
                w.createInstanceOnIframe(_).forEachNode(g, m, y);
              });
            });
          }
        }, {
          key: "iterateThroughNodes",
          value: function(d, g, m, y, w) {
            for (var x = this, _ = this.createIterator(g, d, y), S = [], k = [], T = void 0, E = void 0, M = function() {
              var z = x.getIteratorNode(_);
              return E = z.prevNode, T = z.node, T;
            }; M(); )
              this.iframes && this.forEachIframe(g, function(R) {
                return x.checkIframeFilter(T, E, R, S);
              }, function(R) {
                x.createInstanceOnIframe(R).forEachNode(d, function(z) {
                  return k.push(z);
                }, y);
              }), k.push(T);
            k.forEach(function(R) {
              m(R);
            }), this.iframes && this.handleOpenIframes(S, d, m, y), w();
          }
        }, {
          key: "forEachNode",
          value: function(d, g, m) {
            var y = this, w = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : function() {
            }, x = this.getContexts(), _ = x.length;
            _ || w(), x.forEach(function(S) {
              var k = function() {
                y.iterateThroughNodes(d, S, g, m, function() {
                  --_ <= 0 && w();
                });
              };
              y.iframes ? y.waitForIframes(S, k) : k();
            });
          }
        }], [{
          key: "matches",
          value: function(d, g) {
            var m = typeof g == "string" ? [g] : g, y = d.matches || d.matchesSelector || d.msMatchesSelector || d.mozMatchesSelector || d.oMatchesSelector || d.webkitMatchesSelector;
            if (y) {
              var w = !1;
              return m.every(function(x) {
                return y.call(d, x) ? (w = !0, !1) : !0;
              }), w;
            } else
              return !1;
          }
        }]), f;
      }(), u = function() {
        function f(h) {
          n(this, f), this.ctx = h, this.ie = !1;
          var d = window.navigator.userAgent;
          (d.indexOf("MSIE") > -1 || d.indexOf("Trident") > -1) && (this.ie = !0);
        }
        return a(f, [{
          key: "log",
          value: function(d) {
            var g = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : "debug", m = this.opt.log;
            this.opt.debug && (typeof m > "u" ? "undefined" : r(m)) === "object" && typeof m[g] == "function" && m[g]("mark.js: " + d);
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
            var g = this.opt.synonyms, m = this.opt.caseSensitive ? "" : "i", y = this.opt.ignoreJoiners || this.opt.ignorePunctuation.length ? "\0" : "";
            for (var w in g)
              if (g.hasOwnProperty(w)) {
                var x = g[w], _ = this.opt.wildcards !== "disabled" ? this.setupWildcardsRegExp(w) : this.escapeStr(w), S = this.opt.wildcards !== "disabled" ? this.setupWildcardsRegExp(x) : this.escapeStr(x);
                _ !== "" && S !== "" && (d = d.replace(new RegExp("(" + this.escapeStr(_) + "|" + this.escapeStr(S) + ")", "gm" + m), y + ("(" + this.processSynomyms(_) + "|") + (this.processSynomyms(S) + ")") + y));
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
            return d = d.replace(/(?:\\)*\?/g, function(g) {
              return g.charAt(0) === "\\" ? "?" : "";
            }), d.replace(/(?:\\)*\*/g, function(g) {
              return g.charAt(0) === "\\" ? "*" : "";
            });
          }
        }, {
          key: "createWildcardsRegExp",
          value: function(d) {
            var g = this.opt.wildcards === "withSpaces";
            return d.replace(/\u0001/g, g ? "[\\S\\s]?" : "\\S?").replace(/\u0002/g, g ? "[\\S\\s]*?" : "\\S*");
          }
        }, {
          key: "setupIgnoreJoinersRegExp",
          value: function(d) {
            return d.replace(/[^(|)\\]/g, function(g, m, y) {
              var w = y.charAt(m + 1);
              return /[(|)\\]/.test(w) || w === "" ? g : g + "\0";
            });
          }
        }, {
          key: "createJoinersRegExp",
          value: function(d) {
            var g = [], m = this.opt.ignorePunctuation;
            return Array.isArray(m) && m.length && g.push(this.escapeStr(m.join(""))), this.opt.ignoreJoiners && g.push("\\u00ad\\u200b\\u200c\\u200d"), g.length ? d.split(/\u0000+/).join("[" + g.join("") + "]*") : d;
          }
        }, {
          key: "createDiacriticsRegExp",
          value: function(d) {
            var g = this.opt.caseSensitive ? "" : "i", m = this.opt.caseSensitive ? ["aàáảãạăằắẳẵặâầấẩẫậäåāą", "AÀÁẢÃẠĂẰẮẲẴẶÂẦẤẨẪẬÄÅĀĄ", "cçćč", "CÇĆČ", "dđď", "DĐĎ", "eèéẻẽẹêềếểễệëěēę", "EÈÉẺẼẸÊỀẾỂỄỆËĚĒĘ", "iìíỉĩịîïī", "IÌÍỈĨỊÎÏĪ", "lł", "LŁ", "nñňń", "NÑŇŃ", "oòóỏõọôồốổỗộơởỡớờợöøō", "OÒÓỎÕỌÔỒỐỔỖỘƠỞỠỚỜỢÖØŌ", "rř", "RŘ", "sšśșş", "SŠŚȘŞ", "tťțţ", "TŤȚŢ", "uùúủũụưừứửữựûüůū", "UÙÚỦŨỤƯỪỨỬỮỰÛÜŮŪ", "yýỳỷỹỵÿ", "YÝỲỶỸỴŸ", "zžżź", "ZŽŻŹ"] : ["aàáảãạăằắẳẵặâầấẩẫậäåāąAÀÁẢÃẠĂẰẮẲẴẶÂẦẤẨẪẬÄÅĀĄ", "cçćčCÇĆČ", "dđďDĐĎ", "eèéẻẽẹêềếểễệëěēęEÈÉẺẼẸÊỀẾỂỄỆËĚĒĘ", "iìíỉĩịîïīIÌÍỈĨỊÎÏĪ", "lłLŁ", "nñňńNÑŇŃ", "oòóỏõọôồốổỗộơởỡớờợöøōOÒÓỎÕỌÔỒỐỔỖỘƠỞỠỚỜỢÖØŌ", "rřRŘ", "sšśșşSŠŚȘŞ", "tťțţTŤȚŢ", "uùúủũụưừứửữựûüůūUÙÚỦŨỤƯỪỨỬỮỰÛÜŮŪ", "yýỳỷỹỵÿYÝỲỶỸỴŸ", "zžżźZŽŻŹ"], y = [];
            return d.split("").forEach(function(w) {
              m.every(function(x) {
                if (x.indexOf(w) !== -1) {
                  if (y.indexOf(x) > -1)
                    return !1;
                  d = d.replace(new RegExp("[" + x + "]", "gm" + g), "[" + x + "]"), y.push(x);
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
            var g = this, m = "!\"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~¡¿", y = this.opt.accuracy, w = typeof y == "string" ? y : y.value, x = typeof y == "string" ? [] : y.limiters, _ = "";
            switch (x.forEach(function(S) {
              _ += "|" + g.escapeStr(S);
            }), w) {
              case "partially":
              default:
                return "()(" + d + ")";
              case "complementary":
                return _ = "\\s" + (_ || this.escapeStr(m)), "()([^" + _ + "]*" + d + "[^" + _ + "]*)";
              case "exactly":
                return "(^|\\s" + _ + ")(" + d + ")(?=$|\\s" + _ + ")";
            }
          }
        }, {
          key: "getSeparatedKeywords",
          value: function(d) {
            var g = this, m = [];
            return d.forEach(function(y) {
              g.opt.separateWordSearch ? y.split(" ").forEach(function(w) {
                w.trim() && m.indexOf(w) === -1 && m.push(w);
              }) : y.trim() && m.indexOf(y) === -1 && m.push(y);
            }), {
              keywords: m.sort(function(y, w) {
                return w.length - y.length;
              }),
              length: m.length
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
            var g = this;
            if (!Array.isArray(d) || Object.prototype.toString.call(d[0]) !== "[object Object]")
              return this.log("markRanges() will only accept an array of objects"), this.opt.noMatch(d), [];
            var m = [], y = 0;
            return d.sort(function(w, x) {
              return w.start - x.start;
            }).forEach(function(w) {
              var x = g.callNoMatchOnInvalidRanges(w, y), _ = x.start, S = x.end, k = x.valid;
              k && (w.start = _, w.length = S - _, m.push(w), y = S);
            }), m;
          }
        }, {
          key: "callNoMatchOnInvalidRanges",
          value: function(d, g) {
            var m = void 0, y = void 0, w = !1;
            return d && typeof d.start < "u" ? (m = parseInt(d.start, 10), y = m + parseInt(d.length, 10), this.isNumeric(d.start) && this.isNumeric(d.length) && y - g > 0 && y - m > 0 ? w = !0 : (this.log("Ignoring invalid or overlapping range: " + ("" + JSON.stringify(d))), this.opt.noMatch(d))) : (this.log("Ignoring invalid range: " + JSON.stringify(d)), this.opt.noMatch(d)), {
              start: m,
              end: y,
              valid: w
            };
          }
        }, {
          key: "checkWhitespaceRanges",
          value: function(d, g, m) {
            var y = void 0, w = !0, x = m.length, _ = g - x, S = parseInt(d.start, 10) - _;
            return S = S > x ? x : S, y = S + parseInt(d.length, 10), y > x && (y = x, this.log("End range automatically set to the max value of " + x)), S < 0 || y - S < 0 || S > x || y > x ? (w = !1, this.log("Invalid range: " + JSON.stringify(d)), this.opt.noMatch(d)) : m.substring(S, y).replace(/\s+/g, "") === "" && (w = !1, this.log("Skipping whitespace only range: " + JSON.stringify(d)), this.opt.noMatch(d)), {
              start: S,
              end: y,
              valid: w
            };
          }
        }, {
          key: "getTextNodes",
          value: function(d) {
            var g = this, m = "", y = [];
            this.iterator.forEachNode(NodeFilter.SHOW_TEXT, function(w) {
              y.push({
                start: m.length,
                end: (m += w.textContent).length,
                node: w
              });
            }, function(w) {
              return g.matchesExclude(w.parentNode) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
            }, function() {
              d({
                value: m,
                nodes: y
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
          value: function(d, g, m) {
            var y = this.opt.element ? this.opt.element : "mark", w = d.splitText(g), x = w.splitText(m - g), _ = document.createElement(y);
            return _.setAttribute("data-markjs", "true"), this.opt.className && _.setAttribute("class", this.opt.className), _.textContent = w.textContent, w.parentNode.replaceChild(_, w), x;
          }
        }, {
          key: "wrapRangeInMappedTextNode",
          value: function(d, g, m, y, w) {
            var x = this;
            d.nodes.every(function(_, S) {
              var k = d.nodes[S + 1];
              if (typeof k > "u" || k.start > g) {
                if (!y(_.node))
                  return !1;
                var T = g - _.start, E = (m > _.end ? _.end : m) - _.start, M = d.value.substr(0, _.start), R = d.value.substr(E + _.start);
                if (_.node = x.wrapRangeInTextNode(_.node, T, E), d.value = M + R, d.nodes.forEach(function(z, B) {
                  B >= S && (d.nodes[B].start > 0 && B !== S && (d.nodes[B].start -= E), d.nodes[B].end -= E);
                }), m -= E, w(_.node.previousSibling, _.start), m > _.end)
                  g = _.end;
                else
                  return !1;
              }
              return !0;
            });
          }
        }, {
          key: "wrapMatches",
          value: function(d, g, m, y, w) {
            var x = this, _ = g === 0 ? 0 : g + 1;
            this.getTextNodes(function(S) {
              S.nodes.forEach(function(k) {
                k = k.node;
                for (var T = void 0; (T = d.exec(k.textContent)) !== null && T[_] !== ""; )
                  if (m(T[_], k)) {
                    var E = T.index;
                    if (_ !== 0)
                      for (var M = 1; M < _; M++)
                        E += T[M].length;
                    k = x.wrapRangeInTextNode(k, E, E + T[_].length), y(k.previousSibling), d.lastIndex = 0;
                  }
              }), w();
            });
          }
        }, {
          key: "wrapMatchesAcrossElements",
          value: function(d, g, m, y, w) {
            var x = this, _ = g === 0 ? 0 : g + 1;
            this.getTextNodes(function(S) {
              for (var k = void 0; (k = d.exec(S.value)) !== null && k[_] !== ""; ) {
                var T = k.index;
                if (_ !== 0)
                  for (var E = 1; E < _; E++)
                    T += k[E].length;
                var M = T + k[_].length;
                x.wrapRangeInMappedTextNode(S, T, M, function(R) {
                  return m(k[_], R);
                }, function(R, z) {
                  d.lastIndex = z, y(R);
                });
              }
              w();
            });
          }
        }, {
          key: "wrapRangeFromIndex",
          value: function(d, g, m, y) {
            var w = this;
            this.getTextNodes(function(x) {
              var _ = x.value.length;
              d.forEach(function(S, k) {
                var T = w.checkWhitespaceRanges(S, _, x.value), E = T.start, M = T.end, R = T.valid;
                R && w.wrapRangeInMappedTextNode(x, E, M, function(z) {
                  return g(z, S, x.value.substring(E, M), k);
                }, function(z) {
                  m(z, S);
                });
              }), y();
            });
          }
        }, {
          key: "unwrapMatches",
          value: function(d) {
            for (var g = d.parentNode, m = document.createDocumentFragment(); d.firstChild; )
              m.appendChild(d.removeChild(d.firstChild));
            g.replaceChild(m, d), this.ie ? this.normalizeTextNode(g) : g.normalize();
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
          value: function(d, g) {
            var m = this;
            this.opt = g, this.log('Searching with expression "' + d + '"');
            var y = 0, w = "wrapMatches", x = function(S) {
              y++, m.opt.each(S);
            };
            this.opt.acrossElements && (w = "wrapMatchesAcrossElements"), this[w](d, this.opt.ignoreGroups, function(_, S) {
              return m.opt.filter(S, _, y);
            }, x, function() {
              y === 0 && m.opt.noMatch(d), m.opt.done(y);
            });
          }
        }, {
          key: "mark",
          value: function(d, g) {
            var m = this;
            this.opt = g;
            var y = 0, w = "wrapMatches", x = this.getSeparatedKeywords(typeof d == "string" ? [d] : d), _ = x.keywords, S = x.length, k = this.opt.caseSensitive ? "" : "i", T = function E(M) {
              var R = new RegExp(m.createRegExp(M), "gm" + k), z = 0;
              m.log('Searching with expression "' + R + '"'), m[w](R, 1, function(B, $) {
                return m.opt.filter($, M, y, z);
              }, function(B) {
                z++, y++, m.opt.each(B);
              }, function() {
                z === 0 && m.opt.noMatch(M), _[S - 1] === M ? m.opt.done(y) : E(_[_.indexOf(M) + 1]);
              });
            };
            this.opt.acrossElements && (w = "wrapMatchesAcrossElements"), S === 0 ? this.opt.done(y) : T(_[0]);
          }
        }, {
          key: "markRanges",
          value: function(d, g) {
            var m = this;
            this.opt = g;
            var y = 0, w = this.checkRanges(d);
            w && w.length ? (this.log("Starting to mark with the following ranges: " + JSON.stringify(w)), this.wrapRangeFromIndex(w, function(x, _, S, k) {
              return m.opt.filter(x, _, S, k);
            }, function(x, _) {
              y++, m.opt.each(x, _);
            }, function() {
              m.opt.done(y);
            })) : this.opt.done(y);
          }
        }, {
          key: "unmark",
          value: function(d) {
            var g = this;
            this.opt = d;
            var m = this.opt.element ? this.opt.element : "*";
            m += "[data-markjs]", this.opt.className && (m += "." + this.opt.className), this.log('Removal selector "' + m + '"'), this.iterator.forEachNode(NodeFilter.SHOW_ELEMENT, function(y) {
              g.unwrapMatches(y);
            }, function(y) {
              var w = l.matches(y, m), x = g.matchesExclude(y);
              return !w || x ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
            }, this.opt.done);
          }
        }, {
          key: "opt",
          set: function(d) {
            this._opt = o({}, {
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
        var h = this, d = new u(f);
        return this.mark = function(g, m) {
          return d.mark(g, m), h;
        }, this.markRegExp = function(g, m) {
          return d.markRegExp(g, m), h;
        }, this.markRanges = function(g, m) {
          return d.markRanges(g, m), h;
        }, this.unmark = function(g) {
          return d.unmark(g), h;
        }, this;
      }
      return c;
    });
  }(Vf)), Vf.exports;
}
var FA = NA();
const PA = /* @__PURE__ */ RA(FA);
var zA = (t, e) => {
  e.onClose?.();
}, DA = (t, e, r) => {
  e.onClick?.(r);
}, OA = /* @__PURE__ */ _e('<div class="flex pt-1 text-sm"><span class="px-2 flex gap-2 bg-slate-200 text-slate-500 dark:bg-slate-600 dark:text-slate-300 rounded-md"><div class="text-slate-400 dark:text-slate-400 font-medium">Distance</div> <div class="text-ellipsis whitespace-nowrap overflow-hidden max-w-72"> </div></span></div>'), LA = /* @__PURE__ */ _e('<button class="m-1 p-2 text-left rounded-md hover:bg-slate-300 dark:hover:bg-slate-500"><div class="overflow-hidden text-ellipsis line-clamp-4 leading-5"> </div> <!></button> <hr class="border-slate-300 dark:border-slate-600"/>', 1), BA = /* @__PURE__ */ _e('<div class="flex flex-col w-full h-full"><div class="ml-3 mr-2 my-1 flex items-center text-slate-400 dark:text-slate-500 items-start"><div class="flex-1"><div> </div> <div> </div></div> <div class="flex-none mt-1"><button class="block hover:text-slate-500 dark:hover:text-slate-400"><!></button></div></div> <hr class="border-slate-300 dark:border-slate-600"/> <div class="flex flex-col overflow-x-hidden overflow-y-scroll"></div></div>');
function AA(t, e) {
  mt(e, !0);
  let r = tt(e, "limit", 3, 100);
  function n(x, _) {
    new PA(x).mark(_);
  }
  let a = /* @__PURE__ */ ie(() => e.items.length == 0 ? "No result found." : e.items.length == 1 ? `${e.items.length.toLocaleString()} result.` : e.items.length >= r() ? `More than ${e.items.length.toLocaleString()} results, showing top ${r().toLocaleString()}.` : `${e.items.length.toLocaleString()} results.`);
  var o = BA(), l = ne(o), u = ne(l), c = ne(u), f = ne(c, !0);
  ee(c);
  var h = oe(c, 2), d = ne(h, !0);
  ee(h), ee(u);
  var g = oe(u, 2), m = ne(g);
  m.__click = [zA, e];
  var y = ne(m);
  fh(y, {}), ee(m), ee(g), ee(l);
  var w = oe(l, 4);
  Xt(w, 20, () => e.items, (x) => x, (x, _) => {
    var S = LA(), k = Ie(S);
    k.__click = [DA, e, _];
    var T = ne(k), E = ne(T, !0);
    ee(T), Zw(T, (z, B) => n?.(z, B), () => e.highlight);
    var M = oe(T, 2);
    {
      var R = (z) => {
        var B = OA(), $ = ne(B), L = oe(ne($), 2), q = ne(L, !0);
        ee(L), ee($), ee(B), Ne((j) => it(q, j), [() => _.distance.toFixed(5)]), te(z, B);
      };
      Fe(M, (z) => {
        _.distance != null && z(R);
      });
    }
    ee(k), Pp(2), Ne(() => {
      Q(T, "title", _.text), it(E, _.text);
    }), te(x, S);
  }), ee(w), ee(o), Ne(() => {
    it(f, e.label), it(d, v(a));
  }), te(t, o), yt();
}
Nr(["click"]);
var qA = /* @__PURE__ */ xt('<svg><path fill="currentColor" d="M12,1A11,11,0,1,0,23,12,11,11,0,0,0,12,1Zm0,19a8,8,0,1,1,8-8A8,8,0,0,1,12,20Z" opacity=".25"></path><path fill="currentColor" d="M10.72,19.9a8,8,0,0,1-6.5-9.79A7.77,7.77,0,0,1,10.4,4.16a8,8,0,0,1,9.49,6.52A1.54,1.54,0,0,0,21.38,12h.13a1.37,1.37,0,0,0,1.38-1.54,11,11,0,1,0-12.7,12.39A1.54,1.54,0,0,0,12,21.34h0A1.47,1.47,0,0,0,10.72,19.9Z"><animateTransform attributeName="transform" dur="0.75s" repeatCount="indefinite" type="rotate" values="0 12 12;360 12 12"></animateTransform></path></svg>');
function n3(t, e) {
  const r = /* @__PURE__ */ bn(e, ["$$slots", "$$events", "$$legacy"]);
  var n = qA();
  ri(n, () => ({ viewBox: "0 0 24 24", width: "1.2em", height: "1.2em", ...r })), te(t, n);
}
var jA = /* @__PURE__ */ _e('<span class="pl-2 text-slate-500 dark:text-slate-500"> </span>'), $A = /* @__PURE__ */ _e('<div role="status" class="flex flex-row items-center"><!> <!></div>');
function UA(t, e) {
  let r = tt(e, "status", 3, "Loading...");
  var n = $A(), a = ne(n);
  n3(a, { class: "text-blue-500" });
  var o = oe(a, 2);
  {
    var l = (u) => {
      var c = jA(), f = ne(c, !0);
      ee(c), Ne(() => it(f, r())), te(u, c);
    };
    Fe(o, (u) => {
      r() != null && u(l);
    });
  }
  ee(n), te(t, n);
}
function IA(t) {
  let e = "";
  for (let r = 0; r < t.length; r++)
    e += String.fromCharCode(t[r]);
  return btoa(e);
}
function HA(t) {
  const e = atob(t);
  return new Uint8Array([...e].map((r) => r.charCodeAt(0)));
}
function vs(t, e) {
  if (t.length < e.length)
    return !1;
  for (let r = 0; r < e.length; r++)
    if (t[r] != e[r])
      return !1;
  return !0;
}
function Gx(t) {
  return vs(t, [137, 80, 78, 71, 13, 10, 26, 10]) ? "image/png" : vs(t, [255, 216, 255]) ? "image/jpeg" : vs(t, [73, 73, 42, 0]) ? "image/tiff" : vs(t, [66, 77]) ? "image/bmp" : vs(t, [71, 73, 70, 56, 55, 97]) || vs(t, [71, 73, 70, 56, 55, 97]) ? "image/gif" : "application/octet-stream";
}
function WA(t) {
  if (t == null)
    return null;
  if (typeof t == "string")
    return t.startsWith("data:") ? t : `data:${Gx(HA(t))};base64,` + t;
  {
    let e = null;
    if (t.bytes && t.bytes instanceof Uint8Array && (e = t.bytes), t instanceof Uint8Array && (e = t), e != null)
      return `data:${Gx(e)};base64,` + IA(e);
  }
  return null;
}
class GA {
  element;
  constructor(e, r) {
    this.element = e, this.update(r);
  }
  update(e) {
    if (e.value == null) {
      this.element.innerText = "(null)";
      return;
    }
    let r = WA(e.value);
    if (r != null) {
      let n = document.createElement("img");
      n.src = r, n.style.maxHeight = "100px", this.element.replaceChildren(n);
    } else
      this.element.innerText = "(unknown)";
  }
}
function VA(t, e) {
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
class XA {
  element;
  constructor(e, r) {
    this.element = e, this.update(r);
  }
  update(e) {
    let r = document.createElement("pre");
    r.innerText = VA(e.value), this.element.replaceChildren(r);
  }
}
function Vg() {
  return { async: !1, breaks: !1, extensions: null, gfm: !0, hooks: null, pedantic: !1, renderer: null, silent: !1, tokenizer: null, walkTokens: null };
}
var Hl = Vg();
function i3(t) {
  Hl = t;
}
var $u = { exec: () => null };
function Kt(t, e = "") {
  let r = typeof t == "string" ? t : t.source, n = { replace: (a, o) => {
    let l = typeof o == "string" ? o : o.source;
    return l = l.replace(gn.caret, "$1"), r = r.replace(a, l), n;
  }, getRegex: () => new RegExp(r, e) };
  return n;
}
var gn = { codeRemoveIndent: /^(?: {1,4}| {0,3}\t)/gm, outputLinkReplace: /\\([\[\]])/g, indentCodeCompensation: /^(\s+)(?:```)/, beginningSpace: /^\s+/, endingHash: /#$/, startingSpaceChar: /^ /, endingSpaceChar: / $/, nonSpaceChar: /[^ ]/, newLineCharGlobal: /\n/g, tabCharGlobal: /\t/g, multipleSpaceGlobal: /\s+/g, blankLine: /^[ \t]*$/, doubleBlankLine: /\n[ \t]*\n[ \t]*$/, blockquoteStart: /^ {0,3}>/, blockquoteSetextReplace: /\n {0,3}((?:=+|-+) *)(?=\n|$)/g, blockquoteSetextReplace2: /^ {0,3}>[ \t]?/gm, listReplaceTabs: /^\t+/, listReplaceNesting: /^ {1,4}(?=( {4})*[^ ])/g, listIsTask: /^\[[ xX]\] /, listReplaceTask: /^\[[ xX]\] +/, anyLine: /\n.*\n/, hrefBrackets: /^<(.*)>$/, tableDelimiter: /[:|]/, tableAlignChars: /^\||\| *$/g, tableRowBlankLine: /\n[ \t]*$/, tableAlignRight: /^ *-+: *$/, tableAlignCenter: /^ *:-+: *$/, tableAlignLeft: /^ *:-+ *$/, startATag: /^<a /i, endATag: /^<\/a>/i, startPreScriptTag: /^<(pre|code|kbd|script)(\s|>)/i, endPreScriptTag: /^<\/(pre|code|kbd|script)(\s|>)/i, startAngleBracket: /^</, endAngleBracket: />$/, pedanticHrefTitle: /^([^'"]*[^\s])\s+(['"])(.*)\2/, unicodeAlphaNumeric: /[\p{L}\p{N}]/u, escapeTest: /[&<>"']/, escapeReplace: /[&<>"']/g, escapeTestNoEncode: /[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/, escapeReplaceNoEncode: /[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/g, unescapeTest: /&(#(?:\d+)|(?:#x[0-9A-Fa-f]+)|(?:\w+));?/ig, caret: /(^|[^\[])\^/g, percentDecode: /%25/g, findPipe: /\|/g, splitPipe: / \|/, slashPipe: /\\\|/g, carriageReturn: /\r\n|\r/g, spaceLine: /^ +$/gm, notSpaceStart: /^\S*/, endingNewline: /\n$/, listItemRegex: (t) => new RegExp(`^( {0,3}${t})((?:[	 ][^\\n]*)?(?:\\n|$))`), nextBulletRegex: (t) => new RegExp(`^ {0,${Math.min(3, t - 1)}}(?:[*+-]|\\d{1,9}[.)])((?:[ 	][^\\n]*)?(?:\\n|$))`), hrRegex: (t) => new RegExp(`^ {0,${Math.min(3, t - 1)}}((?:- *){3,}|(?:_ *){3,}|(?:\\* *){3,})(?:\\n+|$)`), fencesBeginRegex: (t) => new RegExp(`^ {0,${Math.min(3, t - 1)}}(?:\`\`\`|~~~)`), headingBeginRegex: (t) => new RegExp(`^ {0,${Math.min(3, t - 1)}}#`), htmlBeginRegex: (t) => new RegExp(`^ {0,${Math.min(3, t - 1)}}<(?:[a-z].*>|!--)`, "i") }, YA = /^(?:[ \t]*(?:\n|$))+/, ZA = /^((?: {4}| {0,3}\t)[^\n]+(?:\n(?:[ \t]*(?:\n|$))*)?)+/, KA = /^ {0,3}(`{3,}(?=[^`\n]*(?:\n|$))|~{3,})([^\n]*)(?:\n|$)(?:|([\s\S]*?)(?:\n|$))(?: {0,3}\1[~`]* *(?=\n|$)|$)/, Fc = /^ {0,3}((?:-[\t ]*){3,}|(?:_[ \t]*){3,}|(?:\*[ \t]*){3,})(?:\n+|$)/, JA = /^ {0,3}(#{1,6})(?=\s|$)(.*)(?:\n+|$)/, Xg = /(?:[*+-]|\d{1,9}[.)])/, a3 = /^(?!bull |blockCode|fences|blockquote|heading|html|table)((?:.|\n(?!\s*?\n|bull |blockCode|fences|blockquote|heading|html|table))+?)\n {0,3}(=+|-+) *(?:\n+|$)/, o3 = Kt(a3).replace(/bull/g, Xg).replace(/blockCode/g, /(?: {4}| {0,3}\t)/).replace(/fences/g, / {0,3}(?:`{3,}|~{3,})/).replace(/blockquote/g, / {0,3}>/).replace(/heading/g, / {0,3}#{1,6}/).replace(/html/g, / {0,3}<[^\n>]+>\n/).replace(/\|table/g, "").getRegex(), QA = Kt(a3).replace(/bull/g, Xg).replace(/blockCode/g, /(?: {4}| {0,3}\t)/).replace(/fences/g, / {0,3}(?:`{3,}|~{3,})/).replace(/blockquote/g, / {0,3}>/).replace(/heading/g, / {0,3}#{1,6}/).replace(/html/g, / {0,3}<[^\n>]+>\n/).replace(/table/g, / {0,3}\|?(?:[:\- ]*\|)+[\:\- ]*\n/).getRegex(), Yg = /^([^\n]+(?:\n(?!hr|heading|lheading|blockquote|fences|list|html|table| +\n)[^\n]+)*)/, eq = /^[^\n]+/, Zg = /(?!\s*\])(?:\\.|[^\[\]\\])+/, tq = Kt(/^ {0,3}\[(label)\]: *(?:\n[ \t]*)?([^<\s][^\s]*|<.*?>)(?:(?: +(?:\n[ \t]*)?| *\n[ \t]*)(title))? *(?:\n+|$)/).replace("label", Zg).replace("title", /(?:"(?:\\"?|[^"\\])*"|'[^'\n]*(?:\n[^'\n]+)*\n?'|\([^()]*\))/).getRegex(), rq = Kt(/^( {0,3}bull)([ \t][^\n]+?)?(?:\n|$)/).replace(/bull/g, Xg).getRegex(), dh = "address|article|aside|base|basefont|blockquote|body|caption|center|col|colgroup|dd|details|dialog|dir|div|dl|dt|fieldset|figcaption|figure|footer|form|frame|frameset|h[1-6]|head|header|hr|html|iframe|legend|li|link|main|menu|menuitem|meta|nav|noframes|ol|optgroup|option|p|param|search|section|summary|table|tbody|td|tfoot|th|thead|title|tr|track|ul", Kg = /<!--(?:-?>|[\s\S]*?(?:-->|$))/, nq = Kt("^ {0,3}(?:<(script|pre|style|textarea)[\\s>][\\s\\S]*?(?:</\\1>[^\\n]*\\n+|$)|comment[^\\n]*(\\n+|$)|<\\?[\\s\\S]*?(?:\\?>\\n*|$)|<![A-Z][\\s\\S]*?(?:>\\n*|$)|<!\\[CDATA\\[[\\s\\S]*?(?:\\]\\]>\\n*|$)|</?(tag)(?: +|\\n|/?>)[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$)|<(?!script|pre|style|textarea)([a-z][\\w-]*)(?:attribute)*? */?>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$)|</(?!script|pre|style|textarea)[a-z][\\w-]*\\s*>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$))", "i").replace("comment", Kg).replace("tag", dh).replace("attribute", / +[a-zA-Z:_][\w.:-]*(?: *= *"[^"\n]*"| *= *'[^'\n]*'| *= *[^\s"'=<>`]+)?/).getRegex(), l3 = Kt(Yg).replace("hr", Fc).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("|lheading", "").replace("|table", "").replace("blockquote", " {0,3}>").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", dh).getRegex(), iq = Kt(/^( {0,3}> ?(paragraph|[^\n]*)(?:\n|$))+/).replace("paragraph", l3).getRegex(), Jg = { blockquote: iq, code: ZA, def: tq, fences: KA, heading: JA, hr: Fc, html: nq, lheading: o3, list: rq, newline: YA, paragraph: l3, table: $u, text: eq }, Vx = Kt("^ *([^\\n ].*)\\n {0,3}((?:\\| *)?:?-+:? *(?:\\| *:?-+:? *)*(?:\\| *)?)(?:\\n((?:(?! *\\n|hr|heading|blockquote|code|fences|list|html).*(?:\\n|$))*)\\n*|$)").replace("hr", Fc).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("blockquote", " {0,3}>").replace("code", "(?: {4}| {0,3}	)[^\\n]").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", dh).getRegex(), aq = { ...Jg, lheading: QA, table: Vx, paragraph: Kt(Yg).replace("hr", Fc).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("|lheading", "").replace("table", Vx).replace("blockquote", " {0,3}>").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", dh).getRegex() }, oq = { ...Jg, html: Kt(`^ *(?:comment *(?:\\n|\\s*$)|<(tag)[\\s\\S]+?</\\1> *(?:\\n{2,}|\\s*$)|<tag(?:"[^"]*"|'[^']*'|\\s[^'"/>\\s]*)*?/?> *(?:\\n{2,}|\\s*$))`).replace("comment", Kg).replace(/tag/g, "(?!(?:a|em|strong|small|s|cite|q|dfn|abbr|data|time|code|var|samp|kbd|sub|sup|i|b|u|mark|ruby|rt|rp|bdi|bdo|span|br|wbr|ins|del|img)\\b)\\w+(?!:|[^\\w\\s@]*@)\\b").getRegex(), def: /^ *\[([^\]]+)\]: *<?([^\s>]+)>?(?: +(["(][^\n]+[")]))? *(?:\n+|$)/, heading: /^(#{1,6})(.*)(?:\n+|$)/, fences: $u, lheading: /^(.+?)\n {0,3}(=+|-+) *(?:\n+|$)/, paragraph: Kt(Yg).replace("hr", Fc).replace("heading", ` *#{1,6} *[^
]`).replace("lheading", o3).replace("|table", "").replace("blockquote", " {0,3}>").replace("|fences", "").replace("|list", "").replace("|html", "").replace("|tag", "").getRegex() }, lq = /^\\([!"#$%&'()*+,\-./:;<=>?@\[\]\\^_`{|}~])/, sq = /^(`+)([^`]|[^`][\s\S]*?[^`])\1(?!`)/, s3 = /^( {2,}|\\)\n(?!\s*$)/, uq = /^(`+|[^`])(?:(?= {2,}\n)|[\s\S]*?(?:(?=[\\<!\[`*_]|\b_|$)|[^ ](?= {2,}\n)))/, hh = /[\p{P}\p{S}]/u, Qg = /[\s\p{P}\p{S}]/u, u3 = /[^\s\p{P}\p{S}]/u, cq = Kt(/^((?![*_])punctSpace)/, "u").replace(/punctSpace/g, Qg).getRegex(), c3 = /(?!~)[\p{P}\p{S}]/u, fq = /(?!~)[\s\p{P}\p{S}]/u, dq = /(?:[^\s\p{P}\p{S}]|~)/u, hq = /\[[^[\]]*?\]\((?:\\.|[^\\\(\)]|\((?:\\.|[^\\\(\)])*\))*\)|`[^`]*?`|<(?! )[^<>]*?>/g, f3 = /^(?:\*+(?:((?!\*)punct)|[^\s*]))|^_+(?:((?!_)punct)|([^\s_]))/, vq = Kt(f3, "u").replace(/punct/g, hh).getRegex(), pq = Kt(f3, "u").replace(/punct/g, c3).getRegex(), d3 = "^[^_*]*?__[^_*]*?\\*[^_*]*?(?=__)|[^*]+(?=[^*])|(?!\\*)punct(\\*+)(?=[\\s]|$)|notPunctSpace(\\*+)(?!\\*)(?=punctSpace|$)|(?!\\*)punctSpace(\\*+)(?=notPunctSpace)|[\\s](\\*+)(?!\\*)(?=punct)|(?!\\*)punct(\\*+)(?!\\*)(?=punct)|notPunctSpace(\\*+)(?=notPunctSpace)", gq = Kt(d3, "gu").replace(/notPunctSpace/g, u3).replace(/punctSpace/g, Qg).replace(/punct/g, hh).getRegex(), mq = Kt(d3, "gu").replace(/notPunctSpace/g, dq).replace(/punctSpace/g, fq).replace(/punct/g, c3).getRegex(), yq = Kt("^[^_*]*?\\*\\*[^_*]*?_[^_*]*?(?=\\*\\*)|[^_]+(?=[^_])|(?!_)punct(_+)(?=[\\s]|$)|notPunctSpace(_+)(?!_)(?=punctSpace|$)|(?!_)punctSpace(_+)(?=notPunctSpace)|[\\s](_+)(?!_)(?=punct)|(?!_)punct(_+)(?!_)(?=punct)", "gu").replace(/notPunctSpace/g, u3).replace(/punctSpace/g, Qg).replace(/punct/g, hh).getRegex(), bq = Kt(/\\(punct)/, "gu").replace(/punct/g, hh).getRegex(), xq = Kt(/^<(scheme:[^\s\x00-\x1f<>]*|email)>/).replace("scheme", /[a-zA-Z][a-zA-Z0-9+.-]{1,31}/).replace("email", /[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+(@)[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+(?![-_])/).getRegex(), wq = Kt(Kg).replace("(?:-->|$)", "-->").getRegex(), _q = Kt("^comment|^</[a-zA-Z][\\w:-]*\\s*>|^<[a-zA-Z][\\w-]*(?:attribute)*?\\s*/?>|^<\\?[\\s\\S]*?\\?>|^<![a-zA-Z]+\\s[\\s\\S]*?>|^<!\\[CDATA\\[[\\s\\S]*?\\]\\]>").replace("comment", wq).replace("attribute", /\s+[a-zA-Z:_][\w.:-]*(?:\s*=\s*"[^"]*"|\s*=\s*'[^']*'|\s*=\s*[^\s"'=<>`]+)?/).getRegex(), Md = /(?:\[(?:\\.|[^\[\]\\])*\]|\\.|`[^`]*`|[^\[\]\\`])*?/, kq = Kt(/^!?\[(label)\]\(\s*(href)(?:(?:[ \t]*(?:\n[ \t]*)?)(title))?\s*\)/).replace("label", Md).replace("href", /<(?:\\.|[^\n<>\\])+>|[^ \t\n\x00-\x1f]*/).replace("title", /"(?:\\"?|[^"\\])*"|'(?:\\'?|[^'\\])*'|\((?:\\\)?|[^)\\])*\)/).getRegex(), h3 = Kt(/^!?\[(label)\]\[(ref)\]/).replace("label", Md).replace("ref", Zg).getRegex(), v3 = Kt(/^!?\[(ref)\](?:\[\])?/).replace("ref", Zg).getRegex(), Sq = Kt("reflink|nolink(?!\\()", "g").replace("reflink", h3).replace("nolink", v3).getRegex(), em = { _backpedal: $u, anyPunctuation: bq, autolink: xq, blockSkip: hq, br: s3, code: sq, del: $u, emStrongLDelim: vq, emStrongRDelimAst: gq, emStrongRDelimUnd: yq, escape: lq, link: kq, nolink: v3, punctuation: cq, reflink: h3, reflinkSearch: Sq, tag: _q, text: uq, url: $u }, Cq = { ...em, link: Kt(/^!?\[(label)\]\((.*?)\)/).replace("label", Md).getRegex(), reflink: Kt(/^!?\[(label)\]\s*\[([^\]]*)\]/).replace("label", Md).getRegex() }, vp = { ...em, emStrongRDelimAst: mq, emStrongLDelim: pq, url: Kt(/^((?:ftp|https?):\/\/|www\.)(?:[a-zA-Z0-9\-]+\.?)+[^\s<]*|^email/, "i").replace("email", /[A-Za-z0-9._+-]+(@)[a-zA-Z0-9-_]+(?:\.[a-zA-Z0-9-_]*[a-zA-Z0-9])+(?![-_])/).getRegex(), _backpedal: /(?:[^?!.,:;*_'"~()&]+|\([^)]*\)|&(?![a-zA-Z0-9]+;$)|[?!.,:;*_'"~)]+(?!$))+/, del: /^(~~?)(?=[^\s~])((?:\\.|[^\\])*?(?:\\.|[^\s~\\]))\1(?=[^~]|$)/, text: /^([`~]+|[^`~])(?:(?= {2,}\n)|(?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)|[\s\S]*?(?:(?=[\\<!\[`*~_]|\b_|https?:\/\/|ftp:\/\/|www\.|$)|[^ ](?= {2,}\n)|[^a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-](?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)))/ }, Eq = { ...vp, br: Kt(s3).replace("{2,}", "*").getRegex(), text: Kt(vp.text).replace("\\b_", "\\b_| {2,}\\n").replace(/\{2,\}/g, "*").getRegex() }, Lf = { normal: Jg, gfm: aq, pedantic: oq }, Tu = { normal: em, gfm: vp, breaks: Eq, pedantic: Cq }, Mq = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }, Xx = (t) => Mq[t];
function Ki(t, e) {
  if (e) {
    if (gn.escapeTest.test(t)) return t.replace(gn.escapeReplace, Xx);
  } else if (gn.escapeTestNoEncode.test(t)) return t.replace(gn.escapeReplaceNoEncode, Xx);
  return t;
}
function Yx(t) {
  try {
    t = encodeURI(t).replace(gn.percentDecode, "%");
  } catch {
    return null;
  }
  return t;
}
function Zx(t, e) {
  let r = t.replace(gn.findPipe, (o, l, u) => {
    let c = !1, f = l;
    for (; --f >= 0 && u[f] === "\\"; ) c = !c;
    return c ? "|" : " |";
  }), n = r.split(gn.splitPipe), a = 0;
  if (n[0].trim() || n.shift(), n.length > 0 && !n.at(-1)?.trim() && n.pop(), e) if (n.length > e) n.splice(e);
  else for (; n.length < e; ) n.push("");
  for (; a < n.length; a++) n[a] = n[a].trim().replace(gn.slashPipe, "|");
  return n;
}
function Nu(t, e, r) {
  let n = t.length;
  if (n === 0) return "";
  let a = 0;
  for (; a < n && t.charAt(n - a - 1) === e; )
    a++;
  return t.slice(0, n - a);
}
function Rq(t, e) {
  if (t.indexOf(e[1]) === -1) return -1;
  let r = 0;
  for (let n = 0; n < t.length; n++) if (t[n] === "\\") n++;
  else if (t[n] === e[0]) r++;
  else if (t[n] === e[1] && (r--, r < 0)) return n;
  return r > 0 ? -2 : -1;
}
function Kx(t, e, r, n, a) {
  let o = e.href, l = e.title || null, u = t[1].replace(a.other.outputLinkReplace, "$1");
  n.state.inLink = !0;
  let c = { type: t[0].charAt(0) === "!" ? "image" : "link", raw: r, href: o, title: l, text: u, tokens: n.inlineTokens(u) };
  return n.state.inLink = !1, c;
}
function Tq(t, e, r) {
  let n = t.match(r.other.indentCodeCompensation);
  if (n === null) return e;
  let a = n[1];
  return e.split(`
`).map((o) => {
    let l = o.match(r.other.beginningSpace);
    if (l === null) return o;
    let [u] = l;
    return u.length >= a.length ? o.slice(a.length) : o;
  }).join(`
`);
}
var Rd = class {
  options;
  rules;
  lexer;
  constructor(t) {
    this.options = t || Hl;
  }
  space(t) {
    let e = this.rules.block.newline.exec(t);
    if (e && e[0].length > 0) return { type: "space", raw: e[0] };
  }
  code(t) {
    let e = this.rules.block.code.exec(t);
    if (e) {
      let r = e[0].replace(this.rules.other.codeRemoveIndent, "");
      return { type: "code", raw: e[0], codeBlockStyle: "indented", text: this.options.pedantic ? r : Nu(r, `
`) };
    }
  }
  fences(t) {
    let e = this.rules.block.fences.exec(t);
    if (e) {
      let r = e[0], n = Tq(r, e[3] || "", this.rules);
      return { type: "code", raw: r, lang: e[2] ? e[2].trim().replace(this.rules.inline.anyPunctuation, "$1") : e[2], text: n };
    }
  }
  heading(t) {
    let e = this.rules.block.heading.exec(t);
    if (e) {
      let r = e[2].trim();
      if (this.rules.other.endingHash.test(r)) {
        let n = Nu(r, "#");
        (this.options.pedantic || !n || this.rules.other.endingSpaceChar.test(n)) && (r = n.trim());
      }
      return { type: "heading", raw: e[0], depth: e[1].length, text: r, tokens: this.lexer.inline(r) };
    }
  }
  hr(t) {
    let e = this.rules.block.hr.exec(t);
    if (e) return { type: "hr", raw: Nu(e[0], `
`) };
  }
  blockquote(t) {
    let e = this.rules.block.blockquote.exec(t);
    if (e) {
      let r = Nu(e[0], `
`).split(`
`), n = "", a = "", o = [];
      for (; r.length > 0; ) {
        let l = !1, u = [], c;
        for (c = 0; c < r.length; c++) if (this.rules.other.blockquoteStart.test(r[c])) u.push(r[c]), l = !0;
        else if (!l) u.push(r[c]);
        else break;
        r = r.slice(c);
        let f = u.join(`
`), h = f.replace(this.rules.other.blockquoteSetextReplace, `
    $1`).replace(this.rules.other.blockquoteSetextReplace2, "");
        n = n ? `${n}
${f}` : f, a = a ? `${a}
${h}` : h;
        let d = this.lexer.state.top;
        if (this.lexer.state.top = !0, this.lexer.blockTokens(h, o, !0), this.lexer.state.top = d, r.length === 0) break;
        let g = o.at(-1);
        if (g?.type === "code") break;
        if (g?.type === "blockquote") {
          let m = g, y = m.raw + `
` + r.join(`
`), w = this.blockquote(y);
          o[o.length - 1] = w, n = n.substring(0, n.length - m.raw.length) + w.raw, a = a.substring(0, a.length - m.text.length) + w.text;
          break;
        } else if (g?.type === "list") {
          let m = g, y = m.raw + `
` + r.join(`
`), w = this.list(y);
          o[o.length - 1] = w, n = n.substring(0, n.length - g.raw.length) + w.raw, a = a.substring(0, a.length - m.raw.length) + w.raw, r = y.substring(o.at(-1).raw.length).split(`
`);
          continue;
        }
      }
      return { type: "blockquote", raw: n, tokens: o, text: a };
    }
  }
  list(t) {
    let e = this.rules.block.list.exec(t);
    if (e) {
      let r = e[1].trim(), n = r.length > 1, a = { type: "list", raw: "", ordered: n, start: n ? +r.slice(0, -1) : "", loose: !1, items: [] };
      r = n ? `\\d{1,9}\\${r.slice(-1)}` : `\\${r}`, this.options.pedantic && (r = n ? r : "[*+-]");
      let o = this.rules.other.listItemRegex(r), l = !1;
      for (; t; ) {
        let c = !1, f = "", h = "";
        if (!(e = o.exec(t)) || this.rules.block.hr.test(t)) break;
        f = e[0], t = t.substring(f.length);
        let d = e[2].split(`
`, 1)[0].replace(this.rules.other.listReplaceTabs, (_) => " ".repeat(3 * _.length)), g = t.split(`
`, 1)[0], m = !d.trim(), y = 0;
        if (this.options.pedantic ? (y = 2, h = d.trimStart()) : m ? y = e[1].length + 1 : (y = e[2].search(this.rules.other.nonSpaceChar), y = y > 4 ? 1 : y, h = d.slice(y), y += e[1].length), m && this.rules.other.blankLine.test(g) && (f += g + `
`, t = t.substring(g.length + 1), c = !0), !c) {
          let _ = this.rules.other.nextBulletRegex(y), S = this.rules.other.hrRegex(y), k = this.rules.other.fencesBeginRegex(y), T = this.rules.other.headingBeginRegex(y), E = this.rules.other.htmlBeginRegex(y);
          for (; t; ) {
            let M = t.split(`
`, 1)[0], R;
            if (g = M, this.options.pedantic ? (g = g.replace(this.rules.other.listReplaceNesting, "  "), R = g) : R = g.replace(this.rules.other.tabCharGlobal, "    "), k.test(g) || T.test(g) || E.test(g) || _.test(g) || S.test(g)) break;
            if (R.search(this.rules.other.nonSpaceChar) >= y || !g.trim()) h += `
` + R.slice(y);
            else {
              if (m || d.replace(this.rules.other.tabCharGlobal, "    ").search(this.rules.other.nonSpaceChar) >= 4 || k.test(d) || T.test(d) || S.test(d)) break;
              h += `
` + g;
            }
            !m && !g.trim() && (m = !0), f += M + `
`, t = t.substring(M.length + 1), d = R.slice(y);
          }
        }
        a.loose || (l ? a.loose = !0 : this.rules.other.doubleBlankLine.test(f) && (l = !0));
        let w = null, x;
        this.options.gfm && (w = this.rules.other.listIsTask.exec(h), w && (x = w[0] !== "[ ] ", h = h.replace(this.rules.other.listReplaceTask, ""))), a.items.push({ type: "list_item", raw: f, task: !!w, checked: x, loose: !1, text: h, tokens: [] }), a.raw += f;
      }
      let u = a.items.at(-1);
      if (u) u.raw = u.raw.trimEnd(), u.text = u.text.trimEnd();
      else return;
      a.raw = a.raw.trimEnd();
      for (let c = 0; c < a.items.length; c++) if (this.lexer.state.top = !1, a.items[c].tokens = this.lexer.blockTokens(a.items[c].text, []), !a.loose) {
        let f = a.items[c].tokens.filter((d) => d.type === "space"), h = f.length > 0 && f.some((d) => this.rules.other.anyLine.test(d.raw));
        a.loose = h;
      }
      if (a.loose) for (let c = 0; c < a.items.length; c++) a.items[c].loose = !0;
      return a;
    }
  }
  html(t) {
    let e = this.rules.block.html.exec(t);
    if (e) return { type: "html", block: !0, raw: e[0], pre: e[1] === "pre" || e[1] === "script" || e[1] === "style", text: e[0] };
  }
  def(t) {
    let e = this.rules.block.def.exec(t);
    if (e) {
      let r = e[1].toLowerCase().replace(this.rules.other.multipleSpaceGlobal, " "), n = e[2] ? e[2].replace(this.rules.other.hrefBrackets, "$1").replace(this.rules.inline.anyPunctuation, "$1") : "", a = e[3] ? e[3].substring(1, e[3].length - 1).replace(this.rules.inline.anyPunctuation, "$1") : e[3];
      return { type: "def", tag: r, raw: e[0], href: n, title: a };
    }
  }
  table(t) {
    let e = this.rules.block.table.exec(t);
    if (!e || !this.rules.other.tableDelimiter.test(e[2])) return;
    let r = Zx(e[1]), n = e[2].replace(this.rules.other.tableAlignChars, "").split("|"), a = e[3]?.trim() ? e[3].replace(this.rules.other.tableRowBlankLine, "").split(`
`) : [], o = { type: "table", raw: e[0], header: [], align: [], rows: [] };
    if (r.length === n.length) {
      for (let l of n) this.rules.other.tableAlignRight.test(l) ? o.align.push("right") : this.rules.other.tableAlignCenter.test(l) ? o.align.push("center") : this.rules.other.tableAlignLeft.test(l) ? o.align.push("left") : o.align.push(null);
      for (let l = 0; l < r.length; l++) o.header.push({ text: r[l], tokens: this.lexer.inline(r[l]), header: !0, align: o.align[l] });
      for (let l of a) o.rows.push(Zx(l, o.header.length).map((u, c) => ({ text: u, tokens: this.lexer.inline(u), header: !1, align: o.align[c] })));
      return o;
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
        let o = Nu(r.slice(0, -1), "\\");
        if ((r.length - o.length) % 2 === 0) return;
      } else {
        let o = Rq(e[2], "()");
        if (o === -2) return;
        if (o > -1) {
          let l = (e[0].indexOf("!") === 0 ? 5 : 4) + e[1].length + o;
          e[2] = e[2].substring(0, o), e[0] = e[0].substring(0, l).trim(), e[3] = "";
        }
      }
      let n = e[2], a = "";
      if (this.options.pedantic) {
        let o = this.rules.other.pedanticHrefTitle.exec(n);
        o && (n = o[1], a = o[3]);
      } else a = e[3] ? e[3].slice(1, -1) : "";
      return n = n.trim(), this.rules.other.startAngleBracket.test(n) && (this.options.pedantic && !this.rules.other.endAngleBracket.test(r) ? n = n.slice(1) : n = n.slice(1, -1)), Kx(e, { href: n && n.replace(this.rules.inline.anyPunctuation, "$1"), title: a && a.replace(this.rules.inline.anyPunctuation, "$1") }, e[0], this.lexer, this.rules);
    }
  }
  reflink(t, e) {
    let r;
    if ((r = this.rules.inline.reflink.exec(t)) || (r = this.rules.inline.nolink.exec(t))) {
      let n = (r[2] || r[1]).replace(this.rules.other.multipleSpaceGlobal, " "), a = e[n.toLowerCase()];
      if (!a) {
        let o = r[0].charAt(0);
        return { type: "text", raw: o, text: o };
      }
      return Kx(r, a, r[0], this.lexer, this.rules);
    }
  }
  emStrong(t, e, r = "") {
    let n = this.rules.inline.emStrongLDelim.exec(t);
    if (!(!n || n[3] && r.match(this.rules.other.unicodeAlphaNumeric)) && (!(n[1] || n[2]) || !r || this.rules.inline.punctuation.exec(r))) {
      let a = [...n[0]].length - 1, o, l, u = a, c = 0, f = n[0][0] === "*" ? this.rules.inline.emStrongRDelimAst : this.rules.inline.emStrongRDelimUnd;
      for (f.lastIndex = 0, e = e.slice(-1 * t.length + a); (n = f.exec(e)) != null; ) {
        if (o = n[1] || n[2] || n[3] || n[4] || n[5] || n[6], !o) continue;
        if (l = [...o].length, n[3] || n[4]) {
          u += l;
          continue;
        } else if ((n[5] || n[6]) && a % 3 && !((a + l) % 3)) {
          c += l;
          continue;
        }
        if (u -= l, u > 0) continue;
        l = Math.min(l, l + u + c);
        let h = [...n[0]][0].length, d = t.slice(0, a + n.index + h + l);
        if (Math.min(a, l) % 2) {
          let m = d.slice(1, -1);
          return { type: "em", raw: d, text: m, tokens: this.lexer.inlineTokens(m) };
        }
        let g = d.slice(2, -2);
        return { type: "strong", raw: d, text: g, tokens: this.lexer.inlineTokens(g) };
      }
    }
  }
  codespan(t) {
    let e = this.rules.inline.code.exec(t);
    if (e) {
      let r = e[2].replace(this.rules.other.newLineCharGlobal, " "), n = this.rules.other.nonSpaceChar.test(r), a = this.rules.other.startingSpaceChar.test(r) && this.rules.other.endingSpaceChar.test(r);
      return n && a && (r = r.substring(1, r.length - 1)), { type: "codespan", raw: e[0], text: r };
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
        let a;
        do
          a = e[0], e[0] = this.rules.inline._backpedal.exec(e[0])?.[0] ?? "";
        while (a !== e[0]);
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
}, Pa = class pp {
  tokens;
  options;
  state;
  tokenizer;
  inlineQueue;
  constructor(e) {
    this.tokens = [], this.tokens.links = /* @__PURE__ */ Object.create(null), this.options = e || Hl, this.options.tokenizer = this.options.tokenizer || new Rd(), this.tokenizer = this.options.tokenizer, this.tokenizer.options = this.options, this.tokenizer.lexer = this, this.inlineQueue = [], this.state = { inLink: !1, inRawBlock: !1, top: !0 };
    let r = { other: gn, block: Lf.normal, inline: Tu.normal };
    this.options.pedantic ? (r.block = Lf.pedantic, r.inline = Tu.pedantic) : this.options.gfm && (r.block = Lf.gfm, this.options.breaks ? r.inline = Tu.breaks : r.inline = Tu.gfm), this.tokenizer.rules = r;
  }
  static get rules() {
    return { block: Lf, inline: Tu };
  }
  static lex(e, r) {
    return new pp(r).lex(e);
  }
  static lexInline(e, r) {
    return new pp(r).inlineTokens(e);
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
      let a;
      if (this.options.extensions?.block?.some((l) => (a = l.call({ lexer: this }, e, r)) ? (e = e.substring(a.raw.length), r.push(a), !0) : !1)) continue;
      if (a = this.tokenizer.space(e)) {
        e = e.substring(a.raw.length);
        let l = r.at(-1);
        a.raw.length === 1 && l !== void 0 ? l.raw += `
` : r.push(a);
        continue;
      }
      if (a = this.tokenizer.code(e)) {
        e = e.substring(a.raw.length);
        let l = r.at(-1);
        l?.type === "paragraph" || l?.type === "text" ? (l.raw += (l.raw.endsWith(`
`) ? "" : `
`) + a.raw, l.text += `
` + a.text, this.inlineQueue.at(-1).src = l.text) : r.push(a);
        continue;
      }
      if (a = this.tokenizer.fences(e)) {
        e = e.substring(a.raw.length), r.push(a);
        continue;
      }
      if (a = this.tokenizer.heading(e)) {
        e = e.substring(a.raw.length), r.push(a);
        continue;
      }
      if (a = this.tokenizer.hr(e)) {
        e = e.substring(a.raw.length), r.push(a);
        continue;
      }
      if (a = this.tokenizer.blockquote(e)) {
        e = e.substring(a.raw.length), r.push(a);
        continue;
      }
      if (a = this.tokenizer.list(e)) {
        e = e.substring(a.raw.length), r.push(a);
        continue;
      }
      if (a = this.tokenizer.html(e)) {
        e = e.substring(a.raw.length), r.push(a);
        continue;
      }
      if (a = this.tokenizer.def(e)) {
        e = e.substring(a.raw.length);
        let l = r.at(-1);
        l?.type === "paragraph" || l?.type === "text" ? (l.raw += (l.raw.endsWith(`
`) ? "" : `
`) + a.raw, l.text += `
` + a.raw, this.inlineQueue.at(-1).src = l.text) : this.tokens.links[a.tag] || (this.tokens.links[a.tag] = { href: a.href, title: a.title });
        continue;
      }
      if (a = this.tokenizer.table(e)) {
        e = e.substring(a.raw.length), r.push(a);
        continue;
      }
      if (a = this.tokenizer.lheading(e)) {
        e = e.substring(a.raw.length), r.push(a);
        continue;
      }
      let o = e;
      if (this.options.extensions?.startBlock) {
        let l = 1 / 0, u = e.slice(1), c;
        this.options.extensions.startBlock.forEach((f) => {
          c = f.call({ lexer: this }, u), typeof c == "number" && c >= 0 && (l = Math.min(l, c));
        }), l < 1 / 0 && l >= 0 && (o = e.substring(0, l + 1));
      }
      if (this.state.top && (a = this.tokenizer.paragraph(o))) {
        let l = r.at(-1);
        n && l?.type === "paragraph" ? (l.raw += (l.raw.endsWith(`
`) ? "" : `
`) + a.raw, l.text += `
` + a.text, this.inlineQueue.pop(), this.inlineQueue.at(-1).src = l.text) : r.push(a), n = o.length !== e.length, e = e.substring(a.raw.length);
        continue;
      }
      if (a = this.tokenizer.text(e)) {
        e = e.substring(a.raw.length);
        let l = r.at(-1);
        l?.type === "text" ? (l.raw += (l.raw.endsWith(`
`) ? "" : `
`) + a.raw, l.text += `
` + a.text, this.inlineQueue.pop(), this.inlineQueue.at(-1).src = l.text) : r.push(a);
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
    let n = e, a = null;
    if (this.tokens.links) {
      let u = Object.keys(this.tokens.links);
      if (u.length > 0) for (; (a = this.tokenizer.rules.inline.reflinkSearch.exec(n)) != null; ) u.includes(a[0].slice(a[0].lastIndexOf("[") + 1, -1)) && (n = n.slice(0, a.index) + "[" + "a".repeat(a[0].length - 2) + "]" + n.slice(this.tokenizer.rules.inline.reflinkSearch.lastIndex));
    }
    for (; (a = this.tokenizer.rules.inline.anyPunctuation.exec(n)) != null; ) n = n.slice(0, a.index) + "++" + n.slice(this.tokenizer.rules.inline.anyPunctuation.lastIndex);
    for (; (a = this.tokenizer.rules.inline.blockSkip.exec(n)) != null; ) n = n.slice(0, a.index) + "[" + "a".repeat(a[0].length - 2) + "]" + n.slice(this.tokenizer.rules.inline.blockSkip.lastIndex);
    let o = !1, l = "";
    for (; e; ) {
      o || (l = ""), o = !1;
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
        let f = 1 / 0, h = e.slice(1), d;
        this.options.extensions.startInline.forEach((g) => {
          d = g.call({ lexer: this }, h), typeof d == "number" && d >= 0 && (f = Math.min(f, d));
        }), f < 1 / 0 && f >= 0 && (c = e.substring(0, f + 1));
      }
      if (u = this.tokenizer.inlineText(c)) {
        e = e.substring(u.raw.length), u.raw.slice(-1) !== "_" && (l = u.raw.slice(-1)), o = !0;
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
}, Td = class {
  options;
  parser;
  constructor(t) {
    this.options = t || Hl;
  }
  space(t) {
    return "";
  }
  code({ text: t, lang: e, escaped: r }) {
    let n = (e || "").match(gn.notSpaceStart)?.[0], a = t.replace(gn.endingNewline, "") + `
`;
    return n ? '<pre><code class="language-' + Ki(n) + '">' + (r ? a : Ki(a, !0)) + `</code></pre>
` : "<pre><code>" + (r ? a : Ki(a, !0)) + `</code></pre>
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
    let a = e ? "ol" : "ul", o = e && r !== 1 ? ' start="' + r + '"' : "";
    return "<" + a + o + `>
` + n + "</" + a + `>
`;
  }
  listitem(t) {
    let e = "";
    if (t.task) {
      let r = this.checkbox({ checked: !!t.checked });
      t.loose ? t.tokens[0]?.type === "paragraph" ? (t.tokens[0].text = r + " " + t.tokens[0].text, t.tokens[0].tokens && t.tokens[0].tokens.length > 0 && t.tokens[0].tokens[0].type === "text" && (t.tokens[0].tokens[0].text = r + " " + Ki(t.tokens[0].tokens[0].text), t.tokens[0].tokens[0].escaped = !0)) : t.tokens.unshift({ type: "text", raw: r + " ", text: r + " ", escaped: !0 }) : e += r + " ";
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
    for (let a = 0; a < t.header.length; a++) r += this.tablecell(t.header[a]);
    e += this.tablerow({ text: r });
    let n = "";
    for (let a = 0; a < t.rows.length; a++) {
      let o = t.rows[a];
      r = "";
      for (let l = 0; l < o.length; l++) r += this.tablecell(o[l]);
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
    return `<code>${Ki(t, !0)}</code>`;
  }
  br(t) {
    return "<br>";
  }
  del({ tokens: t }) {
    return `<del>${this.parser.parseInline(t)}</del>`;
  }
  link({ href: t, title: e, tokens: r }) {
    let n = this.parser.parseInline(r), a = Yx(t);
    if (a === null) return n;
    t = a;
    let o = '<a href="' + t + '"';
    return e && (o += ' title="' + Ki(e) + '"'), o += ">" + n + "</a>", o;
  }
  image({ href: t, title: e, text: r, tokens: n }) {
    n && (r = this.parser.parseInline(n, this.parser.textRenderer));
    let a = Yx(t);
    if (a === null) return Ki(r);
    t = a;
    let o = `<img src="${t}" alt="${r}"`;
    return e && (o += ` title="${Ki(e)}"`), o += ">", o;
  }
  text(t) {
    return "tokens" in t && t.tokens ? this.parser.parseInline(t.tokens) : "escaped" in t && t.escaped ? t.text : Ki(t.text);
  }
}, tm = class {
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
}, za = class gp {
  options;
  renderer;
  textRenderer;
  constructor(e) {
    this.options = e || Hl, this.options.renderer = this.options.renderer || new Td(), this.renderer = this.options.renderer, this.renderer.options = this.options, this.renderer.parser = this, this.textRenderer = new tm();
  }
  static parse(e, r) {
    return new gp(r).parse(e);
  }
  static parseInline(e, r) {
    return new gp(r).parseInline(e);
  }
  parse(e, r = !0) {
    let n = "";
    for (let a = 0; a < e.length; a++) {
      let o = e[a];
      if (this.options.extensions?.renderers?.[o.type]) {
        let u = o, c = this.options.extensions.renderers[u.type].call({ parser: this }, u);
        if (c !== !1 || !["space", "hr", "heading", "code", "table", "blockquote", "list", "html", "paragraph", "text"].includes(u.type)) {
          n += c || "";
          continue;
        }
      }
      let l = o;
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
          for (; a + 1 < e.length && e[a + 1].type === "text"; ) u = e[++a], c += `
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
    for (let a = 0; a < e.length; a++) {
      let o = e[a];
      if (this.options.extensions?.renderers?.[o.type]) {
        let u = this.options.extensions.renderers[o.type].call({ parser: this }, o);
        if (u !== !1 || !["escape", "html", "link", "image", "strong", "em", "codespan", "br", "del", "text"].includes(o.type)) {
          n += u || "";
          continue;
        }
      }
      let l = o;
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
}, Xf = class {
  options;
  block;
  constructor(t) {
    this.options = t || Hl;
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
    return this.block ? Pa.lex : Pa.lexInline;
  }
  provideParser() {
    return this.block ? za.parse : za.parseInline;
  }
}, Nq = class {
  defaults = Vg();
  options = this.setOptions;
  parse = this.parseMarkdown(!0);
  parseInline = this.parseMarkdown(!1);
  Parser = za;
  Renderer = Td;
  TextRenderer = tm;
  Lexer = Pa;
  Tokenizer = Rd;
  Hooks = Xf;
  constructor(...t) {
    this.use(...t);
  }
  walkTokens(t, e) {
    let r = [];
    for (let n of t) switch (r = r.concat(e.call(this, n)), n.type) {
      case "table": {
        let a = n;
        for (let o of a.header) r = r.concat(this.walkTokens(o.tokens, e));
        for (let o of a.rows) for (let l of o) r = r.concat(this.walkTokens(l.tokens, e));
        break;
      }
      case "list": {
        let a = n;
        r = r.concat(this.walkTokens(a.items, e));
        break;
      }
      default: {
        let a = n;
        this.defaults.extensions?.childTokens?.[a.type] ? this.defaults.extensions.childTokens[a.type].forEach((o) => {
          let l = a[o].flat(1 / 0);
          r = r.concat(this.walkTokens(l, e));
        }) : a.tokens && (r = r.concat(this.walkTokens(a.tokens, e)));
      }
    }
    return r;
  }
  use(...t) {
    let e = this.defaults.extensions || { renderers: {}, childTokens: {} };
    return t.forEach((r) => {
      let n = { ...r };
      if (n.async = this.defaults.async || n.async || !1, r.extensions && (r.extensions.forEach((a) => {
        if (!a.name) throw new Error("extension name required");
        if ("renderer" in a) {
          let o = e.renderers[a.name];
          o ? e.renderers[a.name] = function(...l) {
            let u = a.renderer.apply(this, l);
            return u === !1 && (u = o.apply(this, l)), u;
          } : e.renderers[a.name] = a.renderer;
        }
        if ("tokenizer" in a) {
          if (!a.level || a.level !== "block" && a.level !== "inline") throw new Error("extension level must be 'block' or 'inline'");
          let o = e[a.level];
          o ? o.unshift(a.tokenizer) : e[a.level] = [a.tokenizer], a.start && (a.level === "block" ? e.startBlock ? e.startBlock.push(a.start) : e.startBlock = [a.start] : a.level === "inline" && (e.startInline ? e.startInline.push(a.start) : e.startInline = [a.start]));
        }
        "childTokens" in a && a.childTokens && (e.childTokens[a.name] = a.childTokens);
      }), n.extensions = e), r.renderer) {
        let a = this.defaults.renderer || new Td(this.defaults);
        for (let o in r.renderer) {
          if (!(o in a)) throw new Error(`renderer '${o}' does not exist`);
          if (["options", "parser"].includes(o)) continue;
          let l = o, u = r.renderer[l], c = a[l];
          a[l] = (...f) => {
            let h = u.apply(a, f);
            return h === !1 && (h = c.apply(a, f)), h || "";
          };
        }
        n.renderer = a;
      }
      if (r.tokenizer) {
        let a = this.defaults.tokenizer || new Rd(this.defaults);
        for (let o in r.tokenizer) {
          if (!(o in a)) throw new Error(`tokenizer '${o}' does not exist`);
          if (["options", "rules", "lexer"].includes(o)) continue;
          let l = o, u = r.tokenizer[l], c = a[l];
          a[l] = (...f) => {
            let h = u.apply(a, f);
            return h === !1 && (h = c.apply(a, f)), h;
          };
        }
        n.tokenizer = a;
      }
      if (r.hooks) {
        let a = this.defaults.hooks || new Xf();
        for (let o in r.hooks) {
          if (!(o in a)) throw new Error(`hook '${o}' does not exist`);
          if (["options", "block"].includes(o)) continue;
          let l = o, u = r.hooks[l], c = a[l];
          Xf.passThroughHooks.has(o) ? a[l] = (f) => {
            if (this.defaults.async) return Promise.resolve(u.call(a, f)).then((d) => c.call(a, d));
            let h = u.call(a, f);
            return c.call(a, h);
          } : a[l] = (...f) => {
            let h = u.apply(a, f);
            return h === !1 && (h = c.apply(a, f)), h;
          };
        }
        n.hooks = a;
      }
      if (r.walkTokens) {
        let a = this.defaults.walkTokens, o = r.walkTokens;
        n.walkTokens = function(l) {
          let u = [];
          return u.push(o.call(this, l)), a && (u = u.concat(a.call(this, l))), u;
        };
      }
      this.defaults = { ...this.defaults, ...n };
    }), this;
  }
  setOptions(t) {
    return this.defaults = { ...this.defaults, ...t }, this;
  }
  lexer(t, e) {
    return Pa.lex(t, e ?? this.defaults);
  }
  parser(t, e) {
    return za.parse(t, e ?? this.defaults);
  }
  parseMarkdown(t) {
    return (e, r) => {
      let n = { ...r }, a = { ...this.defaults, ...n }, o = this.onError(!!a.silent, !!a.async);
      if (this.defaults.async === !0 && n.async === !1) return o(new Error("marked(): The async option was set to true by an extension. Remove async: false from the parse options object to return a Promise."));
      if (typeof e > "u" || e === null) return o(new Error("marked(): input parameter is undefined or null"));
      if (typeof e != "string") return o(new Error("marked(): input parameter is of type " + Object.prototype.toString.call(e) + ", string expected"));
      a.hooks && (a.hooks.options = a, a.hooks.block = t);
      let l = a.hooks ? a.hooks.provideLexer() : t ? Pa.lex : Pa.lexInline, u = a.hooks ? a.hooks.provideParser() : t ? za.parse : za.parseInline;
      if (a.async) return Promise.resolve(a.hooks ? a.hooks.preprocess(e) : e).then((c) => l(c, a)).then((c) => a.hooks ? a.hooks.processAllTokens(c) : c).then((c) => a.walkTokens ? Promise.all(this.walkTokens(c, a.walkTokens)).then(() => c) : c).then((c) => u(c, a)).then((c) => a.hooks ? a.hooks.postprocess(c) : c).catch(o);
      try {
        a.hooks && (e = a.hooks.preprocess(e));
        let c = l(e, a);
        a.hooks && (c = a.hooks.processAllTokens(c)), a.walkTokens && this.walkTokens(c, a.walkTokens);
        let f = u(c, a);
        return a.hooks && (f = a.hooks.postprocess(f)), f;
      } catch (c) {
        return o(c);
      }
    };
  }
  onError(t, e) {
    return (r) => {
      if (r.message += `
Please report this to https://github.com/markedjs/marked.`, t) {
        let n = "<p>An error occurred:</p><pre>" + Ki(r.message + "", !0) + "</pre>";
        return e ? Promise.resolve(n) : n;
      }
      if (e) return Promise.reject(r);
      throw r;
    };
  }
}, El = new Nq();
function rr(t, e) {
  return El.parse(t, e);
}
rr.options = rr.setOptions = function(t) {
  return El.setOptions(t), rr.defaults = El.defaults, i3(rr.defaults), rr;
};
rr.getDefaults = Vg;
rr.defaults = Hl;
rr.use = function(...t) {
  return El.use(...t), rr.defaults = El.defaults, i3(rr.defaults), rr;
};
rr.walkTokens = function(t, e) {
  return El.walkTokens(t, e);
};
rr.parseInline = El.parseInline;
rr.Parser = za;
rr.parser = za.parse;
rr.Renderer = Td;
rr.TextRenderer = tm;
rr.Lexer = Pa;
rr.lexer = Pa.lex;
rr.Tokenizer = Rd;
rr.Hooks = Xf;
rr.parse = rr;
rr.options;
rr.setOptions;
rr.use;
rr.walkTokens;
rr.parseInline;
za.parse;
Pa.lex;
class Fq {
  element;
  constructor(e, r) {
    this.element = e, this.update(r);
  }
  update(e) {
    this.element.innerHTML = '<div class="markdown-content">' + rr(e.value?.toString() ?? "(null)", { async: !1, gfm: !0 }) + "</div>";
  }
}
class Pq {
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
let p3 = {
  markdown: Fq,
  image: GA,
  url: Pq,
  json: XA
}, zq = [
  { renderer: "markdown", label: "Markdown" },
  { renderer: "image", label: "Image" },
  { renderer: "url", label: "Link" },
  { renderer: "json", label: "JSON" }
];
function Jx(t) {
  if (!(t == null || t == "plain"))
    return typeof t == "string" ? p3[t] : t;
}
function Dq(t, e) {
  let r = {};
  if (e != null)
    for (let n in e)
      r[n] = Jx(e[n]);
  for (let n in t)
    t[n] != null && (r[n] = Jx(t[n]));
  return r;
}
var Oq = /* @__PURE__ */ _e('<tr class="leading-10"><td class="w-full"><div class="max-w-80 whitespace-nowrap text-ellipsis overflow-x-hidden"> </div></td><td><!></td></tr>'), Lq = /* @__PURE__ */ _e('<div class="max-h-48 overflow-x-hidden overflow-y-scroll border border-slate-200 dark:border-slate-600 p-2 rounded-md"><table><tbody></tbody></table></div>');
function Bq(t, e) {
  mt(e, !0);
  function r(l, u) {
    let c = {};
    for (let f of e.columns)
      f.name == l ? u != null && u != "" && (c[f.name] = u) : e.styles[f.name] && (c[f.name] = e.styles[f.name]);
    e.onStylesChange(c);
  }
  var n = Lq(), a = ne(n), o = ne(a);
  Xt(o, 21, () => e.columns, or, (l, u) => {
    var c = Oq(), f = ne(c), h = ne(f), d = ne(h, !0);
    ee(h), ee(f);
    var g = oe(f), m = ne(g);
    {
      let y = /* @__PURE__ */ ie(() => e.styles[v(u).name] ?? null), w = /* @__PURE__ */ ie(() => [
        { value: null, label: "(default)" },
        ...zq.map((x) => ({ value: x.renderer, label: x.label }))
      ]);
      Ko(m, {
        get value() {
          return v(y);
        },
        onChange: (x) => r(v(u).name, x),
        get options() {
          return v(w);
        }
      });
    }
    ee(g), ee(c), Ne(() => it(d, v(u).name)), te(l, c);
  }), ee(o), ee(a), ee(n), te(t, n), yt();
}
function Qx(t, e) {
  mt(e, !0);
  let r = tt(e, "label", 3, null), n = tt(e, "icon", 3, null), a = tt(e, "title", 3, ""), o = tt(e, "order", 3, null), l = tt(e, "style", 3, "default"), u = /* @__PURE__ */ me("ready");
  async function c() {
    if (e.onClick) {
      H(u, "running");
      try {
        await e.onClick(), H(u, "ready");
      } catch {
        H(u, "error");
      }
    }
  }
  {
    let f = /* @__PURE__ */ ie(() => v(u) == "ready" ? n() : v(u) == "running" ? n3 : fh);
    Oi(t, {
      get label() {
        return r();
      },
      get icon() {
        return v(f);
      },
      get title() {
        return a();
      },
      get order() {
        return o();
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
  yt();
}
var Aq = (t, e) => {
  e(!e());
}, qq = /* @__PURE__ */ _e('<span class="flex h-5 items-center"> </span>'), jq = /* @__PURE__ */ _e("<button><!> <!></button>");
function Yf(t, e) {
  mt(e, !0);
  let r = tt(e, "title", 3, ""), n = tt(e, "checked", 15), a = tt(e, "label", 3, null), o = tt(e, "icon", 3, null);
  var l = jq();
  let u;
  l.__click = [Aq, n];
  var c = ne(l);
  {
    var f = (g) => {
      var m = dr();
      const y = /* @__PURE__ */ ie(o);
      var w = Ie(m);
      qp(w, () => v(y), (x, _) => {
        _(x, { class: "w-5 h-5" });
      }), te(g, m);
    };
    Fe(c, (g) => {
      o() != null && g(f);
    });
  }
  var h = oe(c, 2);
  {
    var d = (g) => {
      var m = qq(), y = ne(m, !0);
      ee(m), Ne(() => it(y, a())), te(g, m);
    };
    Fe(h, (g) => {
      a() != null && g(d);
    });
  }
  ee(l), Ne(
    (g) => {
      u = Sr(l, 1, "rounded-md px-1.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 flex select-none items-center focus-visible:outline-2 outline-blue-600 -outline-offset-1", null, u, g), Q(l, "title", r());
    },
    [
      () => ({
        "text-slate-400": !n(),
        "dark:text-slate-500": !n()
      })
    ]
  ), te(t, l), yt();
}
Nr(["click"]);
function $q(t, e) {
  v(e) && t.key == "Escape" && (H(e, !1), t.stopPropagation());
}
var Uq = /* @__PURE__ */ _e("<div><!></div>"), Iq = /* @__PURE__ */ _e('<div class="relative"><!> <!></div>');
function Hq(t, e) {
  mt(e, !0);
  let r = tt(e, "title", 3, ""), n = tt(e, "label", 3, null), a = tt(e, "icon", 3, null), o = tt(e, "anchor", 3, "right"), l = /* @__PURE__ */ me(!1), u = /* @__PURE__ */ me(void 0);
  yn(() => {
    if (v(u) != null) {
      let g = (y) => {
        !v(l) || !v(u) || y.target && !v(u).contains(y.target) && H(l, !1);
      }, m = v(u).getRootNode();
      return m.addEventListener("mousedown", g), () => {
        m.removeEventListener("mousedown", g);
      };
    }
  });
  var c = Iq();
  c.__keydown = [$q, l];
  var f = ne(c);
  Yf(f, {
    get icon() {
      return a();
    },
    get title() {
      return r();
    },
    get label() {
      return n();
    },
    get checked() {
      return v(l);
    },
    set checked(g) {
      H(l, g, !0);
    }
  });
  var h = oe(f, 2);
  {
    var d = (g) => {
      var m = Uq();
      let y;
      var w = ne(m);
      Vu(w, () => e.children ?? Ot), ee(m), Ne((x) => y = Sr(m, 1, "absolute top-[30px] px-3 py-3 rounded-md z-20 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 shadow-lg", null, y, x), [
        () => ({ "right-0": o() == "right", "left-0": o() == "left" })
      ]), te(g, m);
    };
    Fe(h, (g) => {
      v(l) && g(d);
    });
  }
  ee(c), Ii(c, (g) => H(u, g), () => v(u)), te(t, c), yt();
}
Nr(["keydown"]);
function Wq(t, e, r) {
  e(t.clientX - v(r).getBoundingClientRect().left);
  let n = (o) => {
    e(o.clientX - v(r).getBoundingClientRect().left);
  }, a = () => {
    window.removeEventListener("mousemove", n), window.removeEventListener("mouseup", a);
  };
  window.addEventListener("mousemove", n), window.addEventListener("mouseup", a);
}
function Gq(t, e, r, n, a) {
  t.key == "ArrowLeft" ? e(Math.max(e() - (r() ?? 1), n())) : t.key == "ArrowRight" && e(Math.min(e() + (r() ?? 1), a()));
}
var Vq = /* @__PURE__ */ _e('<div class="group relative" role="slider" tabindex="0"><div class="bg-slate-400 dark:bg-slate-500 rounded-full absolute"></div> <div class="bg-blue-500 rounded-full absolute group-hover:bg-blue-600 dark:group-hover:bg-blue-400"></div></div>');
function Xq(t, e) {
  mt(e, !0);
  let r = tt(e, "value", 15, 0), n = tt(e, "min", 3, 0), a = tt(e, "max", 3, 100), o = tt(e, "step", 3, void 0), l = 100, u = 15, c = /* @__PURE__ */ ie(() => (_) => (_ - n()) / (a() - n()) * (l - u)), f = /* @__PURE__ */ ie(() => (_) => _ / (l - u) * (a() - n()) + n()), h = /* @__PURE__ */ ie(() => v(c)(r())), d = /* @__PURE__ */ me(void 0);
  function g(_) {
    let S = v(f)(_ - u / 2);
    S = Math.max(n(), Math.min(a(), S)), o() != null && (S = Math.round(S / o()) * o()), r(S);
  }
  var m = Vq();
  m.__mousedown = [Wq, g, d], m.__keydown = [Gq, r, o, n, a], nt(m, "", {}, { width: "100px", height: "28px" });
  var y = ne(m);
  nt(y, "", {}, { left: "0px", top: "12px", width: "100px", height: "4px" });
  var w = oe(y, 2);
  let x;
  ee(m), Ii(m, (_) => H(d, _), () => v(d)), Ne(
    (_) => {
      Q(m, "aria-valuenow", r()), Q(m, "aria-valuemin", n()), Q(m, "aria-valuemax", a()), x = nt(w, "", x, _);
    },
    [
      () => ({
        left: `${v(h) ?? ""}px`,
        top: "6.5px",
        width: "15px",
        height: "15px"
      })
    ]
  ), te(t, m), yt();
}
Nr(["mousedown", "keydown"]);
const ew = "0.8.0";
var Yq = /* @__PURE__ */ xt('<line class="stroke-orange-500"></line><line class="stroke-orange-500"></line><line class="stroke-orange-500"></line><line class="stroke-orange-500"></line>', 1), Zq = /* @__PURE__ */ xt('<!><circle class="fill-orange-500 stroke-orange-700 stroke-2"></circle>', 1), Kq = /* @__PURE__ */ xt("<svg><g></g></svg>");
function Jq(t, e) {
  mt(e, !0);
  var r = Kq(), n = ne(r);
  Xt(n, 21, () => e.items, or, (a, o) => {
    var l = dr(), u = Ie(l);
    {
      var c = (f) => {
        var h = Zq();
        const d = /* @__PURE__ */ ie(() => e.proxy.location(v(o).x, v(o).y)), g = /* @__PURE__ */ ie(() => v(o).id == e.highlightItem?.id);
        var m = Ie(h);
        {
          var y = (x) => {
            var _ = Yq(), S = Ie(_), k = oe(S), T = oe(k), E = oe(T);
            Ne(() => {
              Q(S, "x1", v(d).x - 20), Q(S, "x2", v(d).x - 10), Q(S, "y1", v(d).y), Q(S, "y2", v(d).y), Q(k, "x1", v(d).x + 20), Q(k, "x2", v(d).x + 10), Q(k, "y1", v(d).y), Q(k, "y2", v(d).y), Q(T, "x1", v(d).x), Q(T, "x2", v(d).x), Q(T, "y1", v(d).y - 20), Q(T, "y2", v(d).y - 10), Q(E, "x1", v(d).x), Q(E, "x2", v(d).x), Q(E, "y1", v(d).y + 20), Q(E, "y2", v(d).y + 10);
            }), te(x, _);
          };
          Fe(m, (x) => {
            v(g) && x(y);
          });
        }
        var w = oe(m);
        Q(w, "r", 4), Ne(() => {
          Q(w, "cx", v(d).x), Q(w, "cy", v(d).y);
        }), te(f, h);
      };
      Fe(u, (f) => {
        v(o).x != null && v(o).y != null && f(c);
      });
    }
    te(a, l);
  }), ee(n), ee(r), Ne(() => {
    Q(r, "width", e.proxy.width), Q(r, "height", e.proxy.height);
  }), te(t, r), yt();
}
var Qq = /* @__PURE__ */ _e("<div></div>");
function ej(t, e) {
  mt(e, !0);
  let r = tt(e, "text", 3, ""), n = tt(e, "renderer", 3, "plain"), a = /* @__PURE__ */ ie(() => p3[n()] ?? null);
  function o(h, d) {
    let g = new d.class(h, { value: d.value });
    return {
      update(m) {
        g.update?.({ value: m.value });
      },
      destroy() {
        g.destroy?.();
      }
    };
  }
  var l = dr(), u = Ie(l);
  {
    var c = (h) => {
      var d = Fn();
      Ne(() => it(d, r())), te(h, d);
    }, f = (h) => {
      var d = dr(), g = Ie(d);
      Id(g, () => v(a), (m) => {
        var y = Qq();
        Zw(y, (w, x) => o?.(w, x), () => ({ class: v(a), value: r() })), te(m, y);
      }), te(h, d);
    };
    Fe(u, (h) => {
      v(a) == null ? h(c) : h(f, !1);
    });
  }
  te(t, l), yt();
}
var tj = /* @__PURE__ */ _e('<a class="underline" target="_blank"> </a>'), rj = /* @__PURE__ */ _e('<div class="px-2 flex gap-2 bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300 rounded-md"><div class="text-slate-400 dark:text-slate-400 font-medium"> </div> <div class="text-ellipsis whitespace-nowrap overflow-hidden max-w-72"><!></div></div>'), nj = (t, e) => {
  e.onNearestNeighborSearch?.(e.tooltip.identifier);
}, ij = /* @__PURE__ */ _e('<div><button class="text-sm flex gap-0.5 items-center text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-300"><!> Nearest Neighbors</button></div>'), aj = /* @__PURE__ */ _e('<div class="embedding-atlas-root"><div><div class="flex-none"><!></div> <div class="flex-none flex flex-row gap-1 flex-wrap"><!></div> <!></div></div>');
function oj(t, e) {
  mt(e, !0);
  let r = tt(e, "textRenderer", 3, "plain");
  function n(y) {
    return typeof y == "string" && (y.startsWith("http://") || y.startsWith("https://"));
  }
  var a = aj(), o = ne(a);
  let l;
  nt(o, "", {}, { "max-width": "400px", "max-height": "300px" });
  var u = ne(o), c = ne(u);
  {
    let y = /* @__PURE__ */ ie(() => e.textField == null ? e.tooltip.text : e.tooltip.fields?.[e.textField]);
    ej(c, {
      get text() {
        return v(y);
      },
      get renderer() {
        return r();
      }
    });
  }
  ee(u);
  var f = oe(u, 2), h = ne(f);
  {
    var d = (y) => {
      var w = dr(), x = Ie(w);
      Xt(x, 17, () => Object.keys(e.tooltip.fields), or, (_, S) => {
        var k = rj();
        const T = /* @__PURE__ */ ie(() => e.tooltip.fields[v(S)]?.toString() ?? "(null)");
        var E = ne(k), M = ne(E, !0);
        ee(E);
        var R = oe(E, 2), z = ne(R);
        {
          var B = (L) => {
            var q = tj(), j = ne(q, !0);
            ee(q), Ne(() => {
              Q(q, "href", v(T)), it(j, v(T));
            }), te(L, q);
          }, $ = (L) => {
            var q = Fn();
            Ne(() => it(q, v(T))), te(L, q);
          };
          Fe(z, (L) => {
            n(v(T)) ? L(B) : L($, !1);
          });
        }
        ee(R), ee(k), Ne(() => {
          it(M, v(S)), Q(R, "title", v(T));
        }), te(_, k);
      }), te(y, w);
    };
    Fe(h, (y) => {
      e.tooltip.fields != null && y(d);
    });
  }
  ee(f);
  var g = oe(f, 2);
  {
    var m = (y) => {
      var w = ij(), x = ne(w);
      x.__click = [nj, e];
      var _ = ne(x);
      LB(_, {}), Pp(), ee(x), ee(w), te(y, w);
    };
    Fe(g, (y) => {
      e.onNearestNeighborSearch && y(m);
    });
  }
  ee(o), ee(a), Ne((y) => l = Sr(o, 1, "p-2 border flex flex-col gap-2 border-slate-500 shadow-md text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 rounded-md text-ellipsis overflow-x-hidden overflow-y-scroll", null, l, y), [() => ({ dark: e.darkMode })]), te(t, a), yt();
}
Nr(["click"]);
function g3(t) {
  return class {
    component;
    constructor(e, r) {
      this.component = Vw({ component: t, target: e, props: r });
    }
    update(e) {
      this.component.$set(e);
    }
    destroy() {
      this.component.$destroy();
    }
  };
}
const lj = g3(oj), sj = g3(
  Jq
);
let m3 = typeof window < "u" ? window.matchMedia?.("(prefers-color-scheme: dark)") : null, y3 = Xu(m3?.matches ?? !1);
m3?.addEventListener("change", (t) => {
  y3.set(t.matches);
});
function uj() {
  let t = Xu(null);
  return { darkMode: gM([y3, t], ([r, n]) => n ?? r), userDarkMode: t };
}
class cj {
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
        this.currentState[e] = n, this.notifier.update((a) => a + 1);
      },
      subscribe: (n) => this.notifier2.subscribe(() => {
        let a = this.currentState[e] ?? null;
        n(a);
      }),
      child: (n) => this.store(e + "/" + n)
    }, this.storeMap.set(e, r)), r;
  }
}
class fj {
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
      let a = (/* @__PURE__ */ new Date()).getTime() + "-" + Math.random();
      this.callbacks.set(a, r), this.worker.postMessage({ ...e, identifier: a });
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
class dj {
  coordinator;
  table;
  columns;
  backend;
  currentIndex = null;
  constructor(e, r, n) {
    this.coordinator = e, this.table = r, this.columns = n, this.currentIndex = null, this.backend = new fj();
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
          ${N.column(this.columns.id)} AS id,
          ${N.column(this.columns.text)} AS text
        FROM ${this.table}
        WHERE ${r}
      `) : n = await this.coordinator.query(`
        SELECT
          ${N.column(this.columns.id)} AS id,
          ${N.column(this.columns.text)} AS text
        FROM ${this.table}
      `), await this.backend.clear(), await this.backend.addPoints(Array.from(n)), this.currentIndex = { predicate: r };
  }
  async fullTextSearch(e, r = {}) {
    let n = r.limit ?? 100, a = r.predicate;
    return await this.buildIndexIfNeeded(a), (await this.backend.query(e, n)).map((l) => ({ id: l }));
  }
}
async function hj(t, e, r, n, a) {
  let o = a.map((h) => h.id), l = /* @__PURE__ */ new Map(), u = /* @__PURE__ */ new Map();
  for (let h = 0; h < o.length; h++)
    l.set(o[h], h), u.set(o[h], a[h]);
  let c = await t.query(`
    SELECT
      ${N.column(r.id, e)} AS id,
      ${r.x ? `${N.column(r.x, e)} AS x,` : ""}
      ${r.y ? `${N.column(r.y, e)} AS y,` : ""}
      ${r.text ? `${N.column(r.text, e)} AS text,` : ""}
    FROM (
      SELECT ${N.column(r.id, e)} AS __search_result_id__
      FROM ${e}
      WHERE
        ${N.column(r.id, e)} IN [${o.map((h) => N.literal(h)).join(", ")}]
        ${n ? `AND (${n})` : ""}
    )
    LEFT JOIN ${e} ON ${N.column(r.id, e)} = __search_result_id__
  `), f = Array.from(c).map((h) => ({ ...h, distance: u.get(h.id)?.distance }));
  return f = f.sort((h, d) => (l.get(h.id) ?? 0) - (l.get(d.id) ?? 0)), f;
}
function vj(t) {
  let { coordinator: e, table: r, idColumn: n, searcher: a, textColumn: o, neighborsColumn: l } = t, u = {};
  if (a != null && a.fullTextSearch != null)
    u.fullTextSearch = a.fullTextSearch.bind(a);
  else if (o != null) {
    let c = new dj(e, r, { id: n, text: o });
    u.fullTextSearch = c.fullTextSearch.bind(c);
  }
  return a != null && a.nearestNeighbors != null ? u.nearestNeighbors = a.nearestNeighbors.bind(a) : l != null && (u.nearestNeighbors = async (c) => {
    let f = N.Query.from(r).select({ knn: N.column(l) }).where(N.eq(N.column(n), N.literal(c))), h = await e.query(f), d = Array.from(h);
    if (d.length != 1)
      return [];
    let { distances: g, ids: m } = d[0].knn;
    return Array.from(m).map((w, x) => ({ id: w, distance: g[x] })).filter((w) => w.id != c);
  }), u;
}
const pj = {
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
function gj(t, e = 1e3) {
  let r;
  return (...a) => {
    r && clearTimeout(r), r = setTimeout(() => {
      t(...a);
    }, e);
  };
}
function b3(t, e) {
  t.preventDefault();
  let r = t.pageX, n = t.pageY, a = (l) => {
    l.preventDefault();
    let u = l.pageX - r, c = l.pageY - n;
    e(u, c);
  }, o = () => {
    window.removeEventListener("mousemove", a), window.removeEventListener("mouseup", o);
  };
  window.addEventListener("mousemove", a), window.addEventListener("mouseup", o);
}
function x3() {
  let t = window.localStorage.getItem("embedding-atlas-defaults");
  if (t == null)
    return {};
  try {
    return JSON.parse(t);
  } catch {
    return {};
  }
}
function mj(t, e, r) {
  return x3()[t] ?? e;
}
function yj(t, e) {
  let r = x3();
  r[t] = e, window.localStorage.setItem("embedding-atlas-defaults", JSON.stringify(r));
}
var bj = /* @__PURE__ */ _e('<div class="p-2"><!></div>'), xj = /* @__PURE__ */ _e('<div class="absolute w-96 left-0 top-[32px] rounded-md right-0 z-20 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 overflow-hidden resize shadow-lg"><!></div>'), wj = /* @__PURE__ */ _e('<div class="relative"><!> <!> <!></div>'), _j = /* @__PURE__ */ _e('<div class="text-slate-500 dark:text-slate-400">向量Atlas可视化</div>'), kj = /* @__PURE__ */ _e('<div class="select-none flex items-center gap-2"><span class="text-slate-500 dark:text-slate-400">阈值</span> <!></div>'), Sj = /* @__PURE__ */ _e("<!> <!> <!>", 1), Cj = /* @__PURE__ */ _e('<h4 class="text-slate-500 dark:text-slate-400 my-2 select-none">文本样式</h4> <!>', 1), Ej = /* @__PURE__ */ _e('<div class="flex flex-row gap-2"><!> <!></div>'), Mj = /* @__PURE__ */ _e('<div class="min-w-96"><h4 class="text-slate-500 dark:text-slate-400 mb-2 select-none">工具提示</h4> <!> <!> <h4 class="text-slate-500 dark:text-slate-400 my-2 select-none">导出</h4> <div class="flex flex-col gap-2"><!> <!></div> <h4 class="text-slate-500 dark:text-slate-400 my-2 select-none">关于</h4> <div> </div></div>'), Rj = /* @__PURE__ */ _e('<div class="flex-1 relative bg-white dark:bg-black rounded-md overflow-hidden"><!></div>'), Tj = (t, e) => {
  let r = v(e);
  b3(t, (n, a) => H(e, Math.max(60, r - a), !0));
}, Nj = /* @__PURE__ */ _e('<div class="h-2 cursor-row-resize"></div>'), Fj = /* @__PURE__ */ _e("<!> <div><!></div>", 1), Pj = /* @__PURE__ */ _e('<div class="flex-1 flex flex-col mt-0 ml-2 mb-2 mr-2 overflow-hidden"><!> <!></div>'), zj = (t, e) => {
  let r = v(e);
  b3(t, (n, a) => H(e, Math.max(300, r - n), !0));
}, Dj = /* @__PURE__ */ _e('<div class="w-2 -ml-2 cursor-col-resize"></div>'), Oj = /* @__PURE__ */ _e('<!> <div><div class="w-full rounded-md overflow-x-hidden overflow-y-scroll"><!></div></div>', 1), Lj = /* @__PURE__ */ _e('<div class="embedding-atlas-root"><div><div class="m-2 flex flex-row justify-between items-center"><div class="flex flex-row flex-1 justify-between"><div class="flex flex-row items-center"><div class="flex-1"><!></div></div> <div class="flex flex-row items-center gap-3"><!></div></div> <div class="relative h-full"><div class="absolute left-0 right-0 top-0 bottom-0 overflow-hidden transition-opacity"><div class="flex h-full gap-2 items-center justify-end whitespace-nowrap"><!> <div class="flex flex-row gap-1 items-center"><button class="flex px-2.5 mr-1 select-none items-center justify-center text-slate-500 dark:text-slate-300 rounded-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 focus-visible:outline-2 outline-blue-600 -outline-offset-1" title="清除筛选">清除</button></div></div></div></div> <div class="w-3"></div> <div class="flex flex-row gap-0.5"><!> <!> <!> <!> <!></div></div> <div class="flex flex-row overflow-hidden h-full"><!> <!></div></div></div>');
function Bj(t, e) {
  mt(e, !0);
  const [r, n] = Ei(), a = () => On(d, "$userDarkMode", r), o = () => On(q, "$plotStateStores", r), l = () => On(h, "$darkMode", r), u = 500, c = Math.min(20, KT()), f = 300, { darkMode: h, userDarkMode: d } = uj();
  yr.coordinator = e.coordinator, yr.darkMode = h, yn(() => {
    switch (e.colorScheme) {
      case "light":
        xu(d, !1);
        break;
      case "dark":
        xu(d, !0);
        break;
      case null:
        xu(d, null);
        break;
    }
  });
  let g = /* @__PURE__ */ me(!1), m = /* @__PURE__ */ me(e.projectionColumns != null), y = /* @__PURE__ */ me(e.projectionColumns == null), w = /* @__PURE__ */ me(!0), x = /* @__PURE__ */ me(320), _ = /* @__PURE__ */ me(400);
  const S = new Zk(e.coordinator, e.table);
  let k = /* @__PURE__ */ me("points"), T = /* @__PURE__ */ me(0), E = /* @__PURE__ */ ie(() => e.projectionColumns != null ? S.defaultViewportScale(e.projectionColumns.x, e.projectionColumns.y) : null), M = /* @__PURE__ */ ie(() => e.automaticLabels ? e.cache != null ? {
    cache: {
      get: (ce) => e.cache.get("labels-" + ce),
      set: (ce, ve) => e.cache.set("labels-" + ce, ve)
    }
  } : !0 : !1), R = /* @__PURE__ */ me("parquet");
  const z = RC.Selection.crossfilter();
  function B() {
    let ce = z.predicate(null);
    return ce == null || ce.length == 0 ? null : typeof ce == "string" ? ce : ce.map((Ce) => Ce.toString()).join(" AND ");
  }
  let $ = /* @__PURE__ */ me([]), L = /* @__PURE__ */ me([]), q = new cj(), j = /* @__PURE__ */ me(null), W = /* @__PURE__ */ ie(() => He(v($))), Y = new Ip(1, { duration: f, easing: Up });
  et(() => {
    Y.set(v(w) ? 1 : 0);
  });
  let G = /* @__PURE__ */ me(gi(mj("textRenderers", {}))), X = /* @__PURE__ */ ie(() => Dq(v(G), e.tableCellRenderers));
  yn(() => {
    yj("textRenderers", v(G));
  });
  let K = /* @__PURE__ */ ie(() => vj({
    coordinator: e.coordinator,
    table: e.table,
    idColumn: e.idColumn,
    textColumn: e.textColumn,
    neighborsColumn: e.neighborsColumn,
    searcher: e.searcher
  })), V = /* @__PURE__ */ ie(() => v(K).fullTextSearch != null), U = /* @__PURE__ */ ie(() => v(K).vectorSearch != null), Z = /* @__PURE__ */ ie(() => v(K).nearestNeighbors != null), le = /* @__PURE__ */ me("full-text"), se = /* @__PURE__ */ ie(() => [
    ...v(V) ? [{ label: "全文搜索", value: "full-text" }] : [],
    ...v(U) ? [{ label: "向量搜索", value: "vector" }] : [],
    ...v(Z) ? [{ label: "最近邻", value: "neighbors" }] : []
  ]), ye = /* @__PURE__ */ me(""), Se = /* @__PURE__ */ me(""), xe = /* @__PURE__ */ me(!1), Ee = /* @__PURE__ */ me(null), Te = /* @__PURE__ */ me(null);
  async function Re(ce, ve) {
    if (v(K) == null || v(se).length == 0) {
      ge();
      return;
    }
    v(se).map((Xe) => Xe.value).indexOf(v(le)) < 0 && (ve = v(se)[0].value), H(xe, !0), H(Se, "Searching...");
    let Ce = B(), ft = [], vt = "", Rt = ce.toString();
    ve == "full-text" && v(K).fullTextSearch != null ? (ce = ce.trim(), ft = await v(K).fullTextSearch(ce, {
      limit: u,
      predicate: Ce,
      onStatus: (Xe) => {
        H(Se, Xe, !0);
      }
    }), vt = ce) : ve == "vector" && v(K).vectorSearch != null ? (ce = ce.trim(), ft = await v(K).vectorSearch(ce, {
      limit: u,
      predicate: Ce,
      onStatus: (Xe) => {
        H(Se, Xe, !0);
      }
    }), vt = ce) : ve == "neighbors" && v(K).nearestNeighbors != null && (Rt = "最近邻 #" + ce.toString(), ft = await v(K).nearestNeighbors(ce, {
      limit: u,
      predicate: Ce,
      onStatus: (Xe) => {
        H(Se, Xe, !0);
      }
    }));
    let zt = await hj(
      e.coordinator,
      e.table,
      {
        id: e.idColumn,
        x: e.projectionColumns?.x,
        y: e.projectionColumns?.y,
        text: e.textColumn
      },
      Ce,
      ft
    );
    H(Se, ""), H(Ee, { label: Rt, highlight: vt, items: zt }, !0);
  }
  const ke = gj(Re, 500);
  function ge() {
    H(Ee, null), H(xe, !1);
  }
  et(() => {
    v(ye) == "" ? ge() : ke(v(ye), v(le));
  });
  let we = /* @__PURE__ */ me(null), $e = /* @__PURE__ */ me(null), qe = /* @__PURE__ */ ie(() => v($e) ?? e.textColumn), Ve = /* @__PURE__ */ ie(() => v(qe) != null ? v(G)[v(qe)] ?? "plain" : "plain"), rt = /* @__PURE__ */ me(null);
  async function dt(ce) {
    if (ce == null) {
      H(rt, null);
      return;
    }
    let ve = v($).find((ft) => ft.name == ce);
    if (ve == null)
      return;
    let Ce;
    if (ve.jsType == "string")
      Ce = await S.makeCategoryColumn(ve.name, 10);
    else if (ve.jsType == "number")
      ve.distinctCount <= 10 ? Ce = await S.makeCategoryColumn(ve.name, 10) : Ce = await S.makeBinnedNumericColumn(ve.name);
    else
      return;
    H(rt, Ce), Ce.legend.length > c && H(k, "points");
  }
  et(() => {
    dt(v(we));
  });
  async function ot(ce, ve, Ce) {
    if (v(E) == null)
      return;
    let ft = await v(E) * 2;
    if (ve == null || Ce == null) {
      if (e.projectionColumns == null)
        return;
      let Rt = (await e.coordinator.query(N.Query.from(e.table).select({
        x: N.column(e.projectionColumns.x),
        y: N.column(e.projectionColumns.y)
      }).where(N.eq(N.column(e.idColumn), N.literal(ce))))).get(0);
      ve = Rt.x, Ce = Rt.y;
    }
    v(j)?.startViewportAnimation({ x: ve, y: Ce, scale: ft });
  }
  function wt() {
    for (let ce of z.clauses)
      ce.source?.reset?.(), z.update({ ...ce, value: null, predicate: null });
  }
  function He(ce) {
    let ve = {};
    ve.id = e.idColumn;
    for (let Ce of ce)
      Ce.name == e.textColumn || Ce.name == e.projectionColumns?.x || Ce.name == e.projectionColumns?.y || Ce.name == e.idColumn || (ve[Ce.name] = Ce.name);
    return ve;
  }
  let We = /* @__PURE__ */ me(null);
  const Mt = (ce) => {
    H(We, ce, !0);
  };
  function Ze(ce) {
    if (typeof ce.version != "string")
      return;
    q.set(ce.plotStates ?? {});
    function ve(Ce, ft) {
      ce.view && Ce in ce.view && ft(ce.view[Ce]);
    }
    ve("showEmbedding", (Ce) => H(m, Ce, !0)), ve("showTable", (Ce) => H(y, Ce, !0)), ve("showSidebar", (Ce) => H(w, Ce, !0)), ve("textRenderers", (Ce) => H(G, Ce, !0)), ve("selectedCategoryColumn", (Ce) => H(we, Ce, !0)), ve("embeddingViewMode", (Ce) => H(k, Ce, !0)), ve("minimumDensityExpFactor", (Ce) => H(T, Ce, !0)), ve("userDarkMode", (Ce) => xu(d, Ce)), ce.plots != null && H(L, ce.plots);
  }
  yn(() => {
    if (!v(g))
      return;
    let ce = {
      version: ew,
      timestamp: (/* @__PURE__ */ new Date()).getTime() / 1e3,
      view: {
        showEmbedding: v(m),
        showTable: v(y),
        showSidebar: v(w),
        textRenderers: v(G),
        selectedCategoryColumn: v(we),
        embeddingViewMode: v(k),
        minimumDensityExpFactor: v(T),
        userDarkMode: a()
      },
      plots: v(L),
      plotStates: o(),
      predicate: B()
    };
    e.onStateChange?.(ce);
  }), e.initialState && Ze(e.initialState), bc(async () => {
    let ce = [
      e.idColumn,
      e.textColumn,
      e.projectionColumns?.x,
      e.projectionColumns?.y
    ].filter((ve) => ve != null);
    H($, (await S.columnDescriptions()).filter((ve) => !ve.name.startsWith("__"))), v(L).length == 0 && H(L, await S.defaultPlots(v($).filter((ve) => ce.indexOf(ve.name) < 0))), H(g, !0);
  });
  function Ut(ce) {
    if (ce.key == "Escape") {
      wt(), ce.preventDefault();
      try {
        document.activeElement?.blur?.();
      } catch {
      }
    }
  }
  var _t = Lj();
  qE("keydown", Sv, Ut), nt(_t, "", {}, { width: "100%", height: "100%" });
  var br = ne(_t);
  let ur;
  var Bt = ne(br), At = ne(Bt), pr = ne(At), xn = ne(pr), wn = ne(xn);
  {
    var Ya = (ce) => {
      var ve = wj(), Ce = ne(ve);
      Jk(Ce, {
        type: "search",
        placeholder: "搜索...",
        className: "w-64",
        get value() {
          return v(ye);
        },
        set value(Xe) {
          H(ye, Xe, !0);
        }
      });
      var ft = oe(Ce, 2);
      {
        var vt = (Xe) => {
          {
            let Tt = /* @__PURE__ */ ie(() => v(se).filter((cr) => cr.value != "neighbors"));
            Ko(Xe, {
              get options() {
                return v(Tt);
              },
              get value() {
                return v(le);
              },
              onChange: (cr) => H(le, cr, !0)
            });
          }
        };
        Fe(ft, (Xe) => {
          v(se).filter((Tt) => Tt.value != "neighbors").length > 1 && Xe(vt);
        });
      }
      var Rt = oe(ft, 2);
      {
        var zt = (Xe) => {
          var Tt = xj();
          nt(Tt, "", {}, { height: "48em" });
          var cr = ne(Tt);
          {
            var zr = (Jt) => {
              AA(Jt, {
                get items() {
                  return v(Ee).items;
                },
                get label() {
                  return v(Ee).label;
                },
                get highlight() {
                  return v(Ee).highlight;
                },
                limit: u,
                onClick: async (ir) => {
                  Mt(ir.id), H(Te, ir, !0), ot(ir.id, ir.x, ir.y);
                },
                onClose: ge
              });
            }, Mr = (Jt) => {
              var ir = dr(), Vr = Ie(ir);
              {
                var $r = (Ur) => {
                  var Vi = bj(), Xl = ne(Vi);
                  UA(Xl, {
                    get status() {
                      return v(Se);
                    }
                  }), ee(Vi), te(Ur, Vi);
                };
                Fe(
                  Vr,
                  (Ur) => {
                    v(Se) != null && Ur($r);
                  },
                  !0
                );
              }
              te(Jt, ir);
            };
            Fe(cr, (Jt) => {
              v(Ee) != null ? Jt(zr) : Jt(Mr, !1);
            });
          }
          ee(Tt), te(Xe, Tt);
        };
        Fe(Rt, (Xe) => {
          v(xe) && Xe(zt);
        });
      }
      ee(ve), te(ce, ve);
    }, ma = (ce) => {
      var ve = _j();
      te(ce, ve);
    };
    Fe(wn, (ce) => {
      v(K) ? ce(Ya) : ce(ma, !1);
    });
  }
  ee(xn), ee(pr);
  var Mi = oe(pr, 2), Za = ne(Mi);
  {
    var Oo = (ce) => {
      var ve = Sj(), Ce = Ie(ve);
      {
        let zt = /* @__PURE__ */ ie(() => [
          { value: null, label: "(无)" },
          ...v($).filter((Xe) => Xe.distinctCount > 1 && (Xe.jsType == "string" && Xe.distinctCount <= 1e4 || Xe.jsType == "number")).map((Xe) => ({ value: Xe.name, label: `${Xe.name} (${Xe.type})` }))
        ]);
        Ko(Ce, {
          label: "颜色",
          get value() {
            return v(we);
          },
          onChange: (Xe) => H(we, Xe, !0),
          get options() {
            return v(zt);
          }
        });
      }
      var ft = oe(Ce, 2);
      {
        let zt = /* @__PURE__ */ ie(() => v(rt) != null && v(rt).legend.length > c);
        Ko(ft, {
          label: "显示模式",
          get value() {
            return v(k);
          },
          onChange: (Xe) => H(k, Xe, !0),
          get disabled() {
            return v(zt);
          },
          options: [
            { value: "points", label: "点图" },
            { value: "density", label: "密度图" }
          ]
        });
      }
      var vt = oe(ft, 2);
      {
        var Rt = (zt) => {
          var Xe = kj(), Tt = oe(ne(Xe), 2);
          Xq(Tt, {
            min: -4,
            max: 4,
            step: 0.1,
            get value() {
              return v(T);
            },
            set value(cr) {
              H(T, cr, !0);
            }
          }), ee(Xe), te(zt, Xe);
        };
        Fe(vt, (zt) => {
          v(k) == "density" && zt(Rt);
        });
      }
      te(ce, ve);
    };
    Fe(Za, (ce) => {
      v(m) && ce(Oo);
    });
  }
  ee(Mi), ee(At);
  var Ka = oe(At, 2);
  let un;
  var Ja = ne(Ka);
  let Lo;
  var Qa = ne(Ja), Wl = ne(Qa);
  MA(Wl, {
    get filter() {
      return z;
    },
    get table() {
      return e.table;
    }
  });
  var Bo = oe(Wl, 2), Qs = ne(Bo);
  Qs.__click = wt, ee(Bo), ee(Qa), ee(Ja), ee(Ka);
  var Gl = oe(Ka, 4), Ao = ne(Gl);
  Hq(Ao, {
    get icon() {
      return AB;
    },
    title: "选项",
    children: (ce, ve) => {
      var Ce = Mj(), ft = oe(ne(Ce), 2);
      {
        let ir = /* @__PURE__ */ ie(() => [
          { value: null, label: e.textColumn ?? "(none)" },
          "---",
          ...Object.keys(v(W)).map((Vr) => ({ value: Vr, label: Vr }))
        ]);
        Ko(ft, {
          class: "w-full",
          get value() {
            return v($e);
          },
          onChange: (Vr) => H($e, Vr, !0),
          get options() {
            return v(ir);
          }
        });
      }
      var vt = oe(ft, 2);
      {
        var Rt = (ir) => {
          var Vr = Cj(), $r = oe(Ie(Vr), 2);
          Bq($r, {
            get columns() {
              return v($);
            },
            get styles() {
              return v(G);
            },
            onStylesChange: (Ur) => {
              H(G, Ur, !0);
            }
          }), te(ir, Vr);
        };
        Fe(vt, (ir) => {
          v($).length > 0 && ir(Rt);
        });
      }
      var zt = oe(vt, 4), Xe = ne(zt);
      {
        var Tt = (ir) => {
          var Vr = Ej(), $r = ne(Vr);
          Qx($r, {
            get icon() {
              return Hx;
            },
            label: "导出选择",
            title: "导出选中的数据点",
            class: "w-48",
            onClick: () => e.onExportSelection(B(), v(R))
          });
          var Ur = oe($r, 2);
          Ko(Ur, {
            label: "格式",
            get value() {
              return v(R);
            },
            onChange: (Vi) => H(R, Vi, !0),
            options: [
              { value: "parquet", label: "Parquet" },
              { value: "jsonl", label: "JSONL" },
              { value: "json", label: "JSON" },
              { value: "csv", label: "CSV" }
            ]
          }), ee(Vr), te(ir, Vr);
        };
        Fe(Xe, (ir) => {
          e.onExportSelection && ir(Tt);
        });
      }
      var cr = oe(Xe, 2);
      {
        var zr = (ir) => {
          Qx(ir, {
            get icon() {
              return Hx;
            },
            label: "导出应用",
            title: "下载独立的静态网页应用",
            class: "w-48",
            get onClick() {
              return e.onExportApplication;
            }
          });
        };
        Fe(cr, (ir) => {
          e.onExportApplication && ir(zr);
        });
      }
      ee(zt);
      var Mr = oe(zt, 4), Jt = ne(Mr);
      ee(Mr), ee(Ce), Ne(() => it(Jt, `向量Atlas可视化, ${ew}`)), te(ce, Ce);
    },
    $$slots: { default: !0 }
  });
  var qo = oe(Ao, 2);
  {
    var eu = (ce) => {
      {
        let ve = /* @__PURE__ */ ie(() => l() ? UB : jB);
        Oi(ce, {
          get icon() {
            return v(ve);
          },
          title: "Toggle dark mode",
          onClick: () => {
            xu(d, !l());
          }
        });
      }
    };
    Fe(qo, (ce) => {
      e.colorScheme == null && ce(eu);
    });
  }
  var Vl = oe(qo, 2);
  {
    var jo = (ce) => {
      Yf(ce, {
        get icon() {
          return MB;
        },
        title: "显示/隐藏向量图",
        get checked() {
          return v(m);
        },
        set checked(ve) {
          H(m, ve, !0);
        }
      });
    };
    Fe(Vl, (ce) => {
      e.projectionColumns != null && ce(jo);
    });
  }
  var he = oe(Vl, 2);
  Yf(he, {
    get icon() {
      return PB;
    },
    title: "显示/隐藏表格",
    get checked() {
      return v(y);
    },
    set checked(ce) {
      H(y, ce, !0);
    }
  });
  var ze = oe(he, 2);
  Yf(ze, {
    get icon() {
      return DB;
    },
    title: "显示/隐藏侧边栏",
    get checked() {
      return v(w);
    },
    set checked(ce) {
      H(w, ce, !0);
    }
  }), ee(Gl), ee(Bt);
  var De = oe(Bt, 2), Oe = ne(De);
  {
    var Be = (ce) => {
      var ve = Pj(), Ce = ne(ve);
      {
        var ft = (zt) => {
          var Xe = Rj(), Tt = ne(Xe);
          {
            let cr = /* @__PURE__ */ ie(() => ({
              class: lj,
              props: {
                textRenderer: v(Ve),
                textField: v($e),
                darkMode: l(),
                onNearestNeighborSearch: v(Z) ? async (Jt) => {
                  Re(Jt, "neighbors");
                } : null
              }
            })), zr = /* @__PURE__ */ ie(() => v(Ee) ? {
              class: sj,
              props: {
                items: v(Ee).items,
                highlightItem: v(Te)
              }
            } : null), Mr = /* @__PURE__ */ ie(() => q.store("embedding-view"));
            Ii(
              Wz(Tt, {
                get table() {
                  return e.table;
                },
                get filter() {
                  return z;
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
                  return v(W);
                },
                get categoryLegend() {
                  return v(rt);
                },
                get mode() {
                  return v(k);
                },
                get minimumDensityExpFactor() {
                  return v(T);
                },
                get automaticLabels() {
                  return v(M);
                },
                get customTooltip() {
                  return v(cr);
                },
                get customOverlay() {
                  return v(zr);
                },
                onClickPoint: (Jt) => Mt(Jt.identifier),
                get stateStore() {
                  return v(Mr);
                }
              }),
              (Jt) => H(j, Jt),
              () => v(j)
            );
          }
          ee(Xe), te(zt, Xe);
        };
        Fe(Ce, (zt) => {
          v(m) && e.projectionColumns != null && zt(ft);
        });
      }
      var vt = oe(Ce, 2);
      {
        var Rt = (zt) => {
          var Xe = Fj(), Tt = Ie(Xe);
          {
            var cr = ($r) => {
              var Ur = Nj();
              Ur.__mousedown = [Tj, x], te($r, Ur);
            };
            Fe(Tt, ($r) => {
              v(m) && $r(cr);
            });
          }
          var zr = oe(Tt, 2);
          let Mr, Jt;
          var ir = ne(zr);
          {
            var Vr = ($r) => {
              var Ur = dr(), Vi = Ie(Ur);
              Id(Vi, () => v($), (Xl) => {
                {
                  let vh = /* @__PURE__ */ ie(() => v($).map((Yl) => Yl.name)), ph = /* @__PURE__ */ ie(() => l() ? "dark" : "light");
                  Lz(Xl, {
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
                      return v(vh);
                    },
                    get filter() {
                      return z;
                    },
                    get scrollTo() {
                      return v(We);
                    },
                    onRowClick: async (Yl) => {
                      await ot(Yl), v(j)?.showTooltip(Yl);
                    },
                    numLines: 3,
                    get colorScheme() {
                      return v(ph);
                    },
                    get theme() {
                      return pj;
                    },
                    get customCells() {
                      return v(X);
                    },
                    highlightHoveredRow: !0
                  });
                }
              }), te($r, Ur);
            };
            Fe(ir, ($r) => {
              v($).length > 0 && $r(Vr);
            });
          }
          ee(zr), Ne(
            ($r, Ur) => {
              Mr = Sr(zr, 1, "z-10 bg-white dark:bg-slate-900 rounded-md overflow-hidden", null, Mr, $r), Jt = nt(zr, "", Jt, Ur);
            },
            [
              () => ({ "h-full": !v(m) }),
              () => ({
                height: v(m) ? v(x) + "px" : null,
                "--hover-color": "var(--color-amber-200)"
              })
            ]
          ), td(3, zr, () => nd, () => ({ duration: f })), te(zt, Xe);
        };
        Fe(vt, (zt) => {
          v(y) && zt(Rt);
        });
      }
      ee(ve), te(ce, ve);
    };
    Fe(Oe, (ce) => {
      (v(y) || v(m)) && ce(Be);
    });
  }
  var ut = oe(Oe, 2);
  {
    var kt = (ce) => {
      var ve = Oj();
      const Ce = /* @__PURE__ */ ie(() => !(v(y) || v(m)));
      var ft = Ie(ve);
      {
        var vt = (Mr) => {
          var Jt = Dj();
          Jt.__mousedown = [zj, _], te(Mr, Jt);
        };
        Fe(ft, (Mr) => {
          v(Ce) || Mr(vt);
        });
      }
      var Rt = oe(ft, 2);
      let zt, Xe;
      var Tt = ne(Rt);
      let cr;
      var zr = ne(Tt);
      {
        let Mr = /* @__PURE__ */ ie(() => v(Ce) ? "full" : "sidebar");
        CA(zr, {
          get table() {
            return e.table;
          },
          get columns() {
            return v($);
          },
          get filter() {
            return z;
          },
          get layout() {
            return v(Mr);
          },
          get stateStores() {
            return q;
          },
          get plots() {
            return v(L);
          },
          set plots(Jt) {
            H(L, Jt);
          }
        });
      }
      ee(Tt), ee(Rt), Ne(
        (Mr, Jt, ir) => {
          zt = Sr(Rt, 1, "flex flex-col mr-2 mb-2 dark:bg-slate-800", null, zt, Mr), Xe = nt(Rt, "", Xe, Jt), cr = nt(Tt, "", cr, ir);
        },
        [
          () => ({
            "ml-2": v(Ce),
            "flex-none": !v(Ce),
            "flex-1": v(Ce)
          }),
          () => ({ width: v(Ce) ? null : `${v(_)}px` }),
          () => ({ width: v(Ce) ? null : `${v(_)}px` })
        ]
      ), td(3, Rt, () => nd, () => ({ axis: "x", duration: f })), te(ce, ve);
    };
    Fe(ut, (ce) => {
      v(w) && ce(kt);
    });
  }
  ee(De), ee(br), ee(_t), Ne(
    (ce, ve, Ce) => {
      ur = Sr(br, 1, "w-full h-full flex flex-col text-slate-800 bg-slate-200 dark:text-slate-200 dark:bg-slate-800", null, ur, ce), un = nt(Ka, "", un, ve), Lo = nt(Ja, "", Lo, Ce);
    },
    [
      () => ({ dark: l() }),
      () => ({
        "--sidebar-tween": Y.current,
        "--padded-width": `calc(${v(_) ?? ""}px - 149.5px - ${l() ? 0 : 1}px)`,
        "max-width": "var(--padded-width)",
        "flex-basis": "calc(var(--padded-width) * var(--sidebar-tween))"
      }),
      () => ({ opacity: v(w) ? 1 : 0 })
    ]
  ), te(t, _t), yt(), n();
}
Nr(["click", "mousedown"]);
const Aj = `/*! tailwindcss v4.1.11 | MIT License | https://tailwindcss.com */@layer properties{@supports (((-webkit-hyphens:none)) and (not (margin-trim:inline))) or ((-moz-orient:inline) and (not (color:rgb(from red r g b)))){*,:before,:after,::backdrop{--tw-rotate-x:initial;--tw-rotate-y:initial;--tw-rotate-z:initial;--tw-skew-x:initial;--tw-skew-y:initial;--tw-space-y-reverse:0;--tw-border-style:solid;--tw-leading:initial;--tw-font-weight:initial;--tw-ordinal:initial;--tw-slashed-zero:initial;--tw-numeric-figure:initial;--tw-numeric-spacing:initial;--tw-numeric-fraction:initial;--tw-shadow:0 0 #0000;--tw-shadow-color:initial;--tw-shadow-alpha:100%;--tw-inset-shadow:0 0 #0000;--tw-inset-shadow-color:initial;--tw-inset-shadow-alpha:100%;--tw-ring-color:initial;--tw-ring-shadow:0 0 #0000;--tw-inset-ring-color:initial;--tw-inset-ring-shadow:0 0 #0000;--tw-ring-inset:initial;--tw-ring-offset-width:0px;--tw-ring-offset-color:#fff;--tw-ring-offset-shadow:0 0 #0000;--tw-blur:initial;--tw-brightness:initial;--tw-contrast:initial;--tw-grayscale:initial;--tw-hue-rotate:initial;--tw-invert:initial;--tw-opacity:initial;--tw-saturate:initial;--tw-sepia:initial;--tw-drop-shadow:initial;--tw-drop-shadow-color:initial;--tw-drop-shadow-alpha:100%;--tw-drop-shadow-size:initial;--tw-ease:initial;--tw-outline-style:solid}}}@layer theme{:root,:host{--font-sans:ui-sans-serif,system-ui,sans-serif,"Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol","Noto Color Emoji";--font-mono:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,"Liberation Mono","Courier New",monospace;--color-red-400:oklch(70.4% .191 22.216);--color-red-500:oklch(63.7% .237 25.331);--color-red-600:oklch(57.7% .245 27.325);--color-orange-500:oklch(70.5% .213 47.604);--color-orange-700:oklch(55.3% .195 38.402);--color-amber-200:oklch(92.4% .12 95.746);--color-blue-100:oklch(93.2% .032 255.585);--color-blue-200:oklch(88.2% .059 254.128);--color-blue-400:oklch(70.7% .165 254.624);--color-blue-500:oklch(62.3% .214 259.815);--color-blue-600:oklch(54.6% .245 262.881);--color-blue-800:oklch(42.4% .199 265.638);--color-blue-900:oklch(37.9% .146 265.522);--color-blue-950:oklch(28.2% .091 267.935);--color-slate-50:oklch(98.4% .003 247.858);--color-slate-100:oklch(96.8% .007 247.896);--color-slate-200:oklch(92.9% .013 255.508);--color-slate-300:oklch(86.9% .022 252.894);--color-slate-400:oklch(70.4% .04 256.788);--color-slate-500:oklch(55.4% .046 257.417);--color-slate-600:oklch(44.6% .043 257.281);--color-slate-700:oklch(37.2% .044 257.287);--color-slate-800:oklch(27.9% .041 260.031);--color-slate-900:oklch(20.8% .042 265.755);--color-slate-950:oklch(12.9% .042 264.695);--color-gray-200:oklch(92.8% .006 264.531);--color-gray-400:oklch(70.7% .022 261.325);--color-gray-600:oklch(44.6% .03 256.802);--color-black:#000;--color-white:#fff;--spacing:.25rem;--font-weight-medium:500;--ease-in-out:cubic-bezier(.4,0,.2,1);--default-transition-duration:.15s;--default-transition-timing-function:cubic-bezier(.4,0,.2,1);--default-font-family:var(--font-sans);--default-mono-font-family:var(--font-mono)}}@layer base{*,:after,:before,::backdrop{box-sizing:border-box;border:0 solid;margin:0;padding:0}::file-selector-button{box-sizing:border-box;border:0 solid;margin:0;padding:0}html,:host{-webkit-text-size-adjust:100%;tab-size:4;line-height:1.5;font-family:var(--default-font-family,ui-sans-serif,system-ui,sans-serif,"Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol","Noto Color Emoji");font-feature-settings:var(--default-font-feature-settings,normal);font-variation-settings:var(--default-font-variation-settings,normal);-webkit-tap-highlight-color:transparent}hr{height:0;color:inherit;border-top-width:1px}abbr:where([title]){-webkit-text-decoration:underline dotted;text-decoration:underline dotted}h1,h2,h3,h4,h5,h6{font-size:inherit;font-weight:inherit}a{color:inherit;-webkit-text-decoration:inherit;text-decoration:inherit}b,strong{font-weight:bolder}code,kbd,samp,pre{font-family:var(--default-mono-font-family,ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,"Liberation Mono","Courier New",monospace);font-feature-settings:var(--default-mono-font-feature-settings,normal);font-variation-settings:var(--default-mono-font-variation-settings,normal);font-size:1em}small{font-size:80%}sub,sup{vertical-align:baseline;font-size:75%;line-height:0;position:relative}sub{bottom:-.25em}sup{top:-.5em}table{text-indent:0;border-color:inherit;border-collapse:collapse}:-moz-focusring{outline:auto}progress{vertical-align:baseline}summary{display:list-item}ol,ul,menu{list-style:none}img,svg,video,canvas,audio,iframe,embed,object{vertical-align:middle;display:block}img,video{max-width:100%;height:auto}button,input,select,optgroup,textarea{font:inherit;font-feature-settings:inherit;font-variation-settings:inherit;letter-spacing:inherit;color:inherit;opacity:1;background-color:#0000;border-radius:0}::file-selector-button{font:inherit;font-feature-settings:inherit;font-variation-settings:inherit;letter-spacing:inherit;color:inherit;opacity:1;background-color:#0000;border-radius:0}:where(select:is([multiple],[size])) optgroup{font-weight:bolder}:where(select:is([multiple],[size])) optgroup option{padding-inline-start:20px}::file-selector-button{margin-inline-end:4px}::placeholder{opacity:1}@supports (not ((-webkit-appearance:-apple-pay-button))) or (contain-intrinsic-size:1px){::placeholder{color:currentColor}@supports (color:color-mix(in lab,red,red)){::placeholder{color:color-mix(in oklab,currentcolor 50%,transparent)}}}textarea{resize:vertical}::-webkit-search-decoration{-webkit-appearance:none}::-webkit-date-and-time-value{min-height:1lh;text-align:inherit}::-webkit-datetime-edit{display:inline-flex}::-webkit-datetime-edit-fields-wrapper{padding:0}::-webkit-datetime-edit{padding-block:0}::-webkit-datetime-edit-year-field{padding-block:0}::-webkit-datetime-edit-month-field{padding-block:0}::-webkit-datetime-edit-day-field{padding-block:0}::-webkit-datetime-edit-hour-field{padding-block:0}::-webkit-datetime-edit-minute-field{padding-block:0}::-webkit-datetime-edit-second-field{padding-block:0}::-webkit-datetime-edit-millisecond-field{padding-block:0}::-webkit-datetime-edit-meridiem-field{padding-block:0}:-moz-ui-invalid{box-shadow:none}button,input:where([type=button],[type=reset],[type=submit]){appearance:button}::file-selector-button{appearance:button}::-webkit-inner-spin-button{height:auto}::-webkit-outer-spin-button{height:auto}[hidden]:where(:not([hidden=until-found])){display:none!important}:root,:host{--tw-border-style:solid;--tw-font-weight:initial;--tw-tracking:initial;--tw-shadow:0 0 #0000;--tw-shadow-color:initial;--tw-inset-shadow:0 0 #0000;--tw-inset-shadow-color:initial;--tw-ring-color:initial;--tw-ring-shadow:0 0 #0000;--tw-inset-ring-color:initial;--tw-inset-ring-shadow:0 0 #0000;--tw-ring-inset:initial;--tw-ring-offset-width:0px;--tw-ring-offset-color:#fff;--tw-ring-offset-shadow:0 0 #0000;font-family:system-ui,-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Oxygen,Ubuntu,Cantarell,Open Sans,Helvetica Neue,sans-serif;font-size:13px}}@layer components;@layer utilities{.visible{visibility:visible}.absolute{position:absolute}.fixed{position:fixed}.relative{position:relative}.static{position:static}.top-0{top:calc(var(--spacing)*0)}.top-\\[30px\\]{top:30px}.top-\\[32px\\]{top:32px}.right-0{right:calc(var(--spacing)*0)}.bottom-0{bottom:calc(var(--spacing)*0)}.left-0{left:calc(var(--spacing)*0)}.z-10{z-index:10}.z-20{z-index:20}.container{width:100%}@media (min-width:520px){.container{max-width:520px}}@media (min-width:624px){.container{max-width:624px}}@media (min-width:832px){.container{max-width:832px}}@media (min-width:1040px){.container{max-width:1040px}}@media (min-width:1248px){.container{max-width:1248px}}.m-1{margin:3.25px}.m-2{margin:6.5px}.mx-2{margin-inline:6.5px}.my-0{margin-block:calc(var(--spacing)*0)}.my-1{margin-block:3.25px}.my-2{margin-block:6.5px}.mt-0{margin-top:calc(var(--spacing)*0)}.mt-1{margin-top:3.25px}.mt-2{margin-top:6.5px}.mt-4{margin-top:13px}.mr-1{margin-right:3.25px}.mr-2{margin-right:6.5px}.mb-1{margin-bottom:3.25px}.mb-2{margin-bottom:6.5px}.-ml-2{margin-left:-6.5px}.ml-1{margin-left:3.25px}.ml-2{margin-left:6.5px}.ml-3{margin-left:9.75px}.form-input{appearance:none;--tw-shadow:0 0 #0000;background-color:#fff;border-width:1px;border-color:#6a7282;border-radius:0;padding:.5rem .75rem;font-size:1rem;line-height:1.5rem}.form-input:focus{outline-offset:2px;--tw-ring-inset:var(--tw-empty, );--tw-ring-offset-width:0px;--tw-ring-offset-color:#fff;--tw-ring-color:oklch(54.6% .245 262.881);--tw-ring-offset-shadow:var(--tw-ring-inset)0 0 0 var(--tw-ring-offset-width)var(--tw-ring-offset-color);--tw-ring-shadow:var(--tw-ring-inset)0 0 0 calc(1px + var(--tw-ring-offset-width))var(--tw-ring-color);box-shadow:var(--tw-ring-offset-shadow),var(--tw-ring-shadow),var(--tw-shadow);border-color:#155dfc;outline:2px solid #0000}.form-input::placeholder{color:#6a7282;opacity:1}.form-input::-webkit-datetime-edit-fields-wrapper{padding:0}.form-input::-webkit-date-and-time-value{min-height:1.5em}.form-input::-webkit-date-and-time-value{text-align:inherit}.form-input::-webkit-datetime-edit{display:inline-flex}.form-input::-webkit-datetime-edit{padding-top:0;padding-bottom:0}.form-input::-webkit-datetime-edit-year-field{padding-top:0;padding-bottom:0}.form-input::-webkit-datetime-edit-month-field{padding-top:0;padding-bottom:0}.form-input::-webkit-datetime-edit-day-field{padding-top:0;padding-bottom:0}.form-input::-webkit-datetime-edit-hour-field{padding-top:0;padding-bottom:0}.form-input::-webkit-datetime-edit-minute-field{padding-top:0;padding-bottom:0}.form-input::-webkit-datetime-edit-second-field{padding-top:0;padding-bottom:0}.form-input::-webkit-datetime-edit-millisecond-field{padding-top:0;padding-bottom:0}.form-input::-webkit-datetime-edit-meridiem-field{padding-top:0;padding-bottom:0}.line-clamp-4{-webkit-line-clamp:4;-webkit-box-orient:vertical;display:-webkit-box;overflow:hidden}.block{display:block}.flex{display:flex}.grid{display:grid}.hidden{display:none}.inline{display:inline}.table{display:table}.size-fit{width:fit-content;height:fit-content}.\\!h-24{height:78px!important}.h-2{height:6.5px}.h-3{height:9.75px}.h-4{height:13px}.h-5{height:16.25px}.h-8{height:26px}.h-12{height:39px}.h-64{height:208px}.h-96{height:312px}.h-\\[28px\\]{height:28px}.h-full{height:100%}.max-h-48{max-height:156px}.w-2{width:6.5px}.w-3{width:9.75px}.w-4{width:13px}.w-5{width:16.25px}.w-7{width:22.75px}.w-12{width:39px}.w-24{width:78px}.w-40{width:130px}.w-48{width:156px}.w-64{width:208px}.w-72{width:234px}.w-96{width:312px}.w-\\[4rem\\]{width:4rem}.w-\\[40rem\\]{width:40rem}.w-\\[420px\\]{width:420px}.w-full{width:100%}.max-w-32{max-width:104px}.max-w-72{max-width:234px}.max-w-80{max-width:260px}.min-w-96{min-width:312px}.flex-1{flex:1}.flex-none{flex:none}.transform{transform:var(--tw-rotate-x,)var(--tw-rotate-y,)var(--tw-rotate-z,)var(--tw-skew-x,)var(--tw-skew-y,)}.cursor-col-resize{cursor:col-resize}.cursor-row-resize{cursor:row-resize}.resize{resize:both}.form-select{appearance:none;--tw-shadow:0 0 #0000;background-color:#fff;border-width:1px;border-color:#6a7282;border-radius:0;padding:.5rem .75rem;font-size:1rem;line-height:1.5rem}.form-select:focus{outline-offset:2px;--tw-ring-inset:var(--tw-empty, );--tw-ring-offset-width:0px;--tw-ring-offset-color:#fff;--tw-ring-color:oklch(54.6% .245 262.881);--tw-ring-offset-shadow:var(--tw-ring-inset)0 0 0 var(--tw-ring-offset-width)var(--tw-ring-offset-color);--tw-ring-shadow:var(--tw-ring-inset)0 0 0 calc(1px + var(--tw-ring-offset-width))var(--tw-ring-color);box-shadow:var(--tw-ring-offset-shadow),var(--tw-ring-shadow),var(--tw-shadow);border-color:#155dfc;outline:2px solid #0000}.form-select{print-color-adjust:exact;background-image:url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='oklch(55.1%25 0.027 264.364)' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");background-position:right .5rem center;background-repeat:no-repeat;background-size:1.5em 1.5em;padding-right:2.5rem}.form-select:where([size]:not([size="1"])){background-image:initial;background-position:initial;background-repeat:unset;background-size:initial;print-color-adjust:unset;padding-right:.75rem}.form-textarea{appearance:none;--tw-shadow:0 0 #0000;background-color:#fff;border-width:1px;border-color:#6a7282;border-radius:0;padding:.5rem .75rem;font-size:1rem;line-height:1.5rem}.form-textarea:focus{outline-offset:2px;--tw-ring-inset:var(--tw-empty, );--tw-ring-offset-width:0px;--tw-ring-offset-color:#fff;--tw-ring-color:oklch(54.6% .245 262.881);--tw-ring-offset-shadow:var(--tw-ring-inset)0 0 0 var(--tw-ring-offset-width)var(--tw-ring-offset-color);--tw-ring-shadow:var(--tw-ring-inset)0 0 0 calc(1px + var(--tw-ring-offset-width))var(--tw-ring-color);box-shadow:var(--tw-ring-offset-shadow),var(--tw-ring-shadow),var(--tw-shadow);border-color:#155dfc;outline:2px solid #0000}.form-textarea::placeholder{color:#6a7282;opacity:1}.flex-col{flex-direction:column}.flex-row{flex-direction:row}.flex-wrap{flex-wrap:wrap}.place-content-center{place-content:center}.items-center{align-items:center}.items-end{align-items:flex-end}.items-start{align-items:flex-start}.justify-between{justify-content:space-between}.justify-center{justify-content:center}.justify-end{justify-content:flex-end}.gap-0\\.5{gap:1.625px}.gap-1{gap:3.25px}.gap-2{gap:6.5px}.gap-3{gap:9.75px}.gap-4{gap:13px}.gap-\\[1px\\]{gap:1px}:where(.space-y-2>:not(:last-child)){--tw-space-y-reverse:0;margin-block-start:calc(6.5px*var(--tw-space-y-reverse));margin-block-end:calc(6.5px*calc(1 - var(--tw-space-y-reverse)))}.overflow-hidden{overflow:hidden}.overflow-x-hidden{overflow-x:hidden}.overflow-y-scroll{overflow-y:scroll}.rounded{border-radius:3.25px}.rounded-full{border-radius:3.40282e38px}.rounded-md{border-radius:4.875px}.rounded-sm{border-radius:1.625px}.border{border-style:var(--tw-border-style);border-width:1px}.border-0{border-style:var(--tw-border-style);border-width:0}.border-2{border-style:var(--tw-border-style);border-width:2px}.border-dashed{--tw-border-style:dashed;border-style:dashed}.\\!border-blue-400{border-color:var(--color-blue-400)!important}.\\!border-slate-500{border-color:var(--color-slate-500)!important}.border-red-500{border-color:var(--color-red-500)}.border-slate-200{border-color:var(--color-slate-200)}.border-slate-300{border-color:var(--color-slate-300)}.border-slate-500{border-color:var(--color-slate-500)}.\\!bg-blue-100{background-color:var(--color-blue-100)!important}.\\!bg-slate-300{background-color:var(--color-slate-300)!important}.\\!bg-slate-500{background-color:var(--color-slate-500)!important}.bg-blue-100{background-color:var(--color-blue-100)}.bg-blue-200{background-color:var(--color-blue-200)}.bg-blue-500{background-color:var(--color-blue-500)}.bg-gray-400{background-color:var(--color-gray-400)}.bg-slate-50{background-color:var(--color-slate-50)}.bg-slate-100{background-color:var(--color-slate-100)}.bg-slate-200{background-color:var(--color-slate-200)}.bg-slate-400{background-color:var(--color-slate-400)}.bg-slate-500{background-color:var(--color-slate-500)}.bg-slate-600{background-color:var(--color-slate-600)}.bg-slate-800{background-color:var(--color-slate-800)}.bg-slate-900{background-color:var(--color-slate-900)}.bg-slate-950{background-color:var(--color-slate-950)}.bg-white{background-color:var(--color-white)}.bg-white\\/90{background-color:#ffffffe6}@supports (color:color-mix(in lab,red,red)){.bg-white\\/90{background-color:color-mix(in oklab,var(--color-white)90%,transparent)}}.fill-orange-500{fill:var(--color-orange-500)}.stroke-orange-500{stroke:var(--color-orange-500)}.stroke-orange-700{stroke:var(--color-orange-700)}.stroke-2{stroke-width:2px}.p-1{padding:3.25px}.p-2{padding:6.5px}.p-4{padding:13px}.px-1\\.5{padding-inline:4.875px}.px-2{padding-inline:6.5px}.px-2\\.5{padding-inline:8.125px}.px-3{padding-inline:9.75px}.py-0{padding-block:calc(var(--spacing)*0)}.py-0\\.5{padding-block:1.625px}.py-1{padding-block:3.25px}.py-1\\.5{padding-block:4.875px}.py-3{padding-block:9.75px}.py-20{padding-block:65px}.pt-1{padding-top:3.25px}.pt-2{padding-top:6.5px}.pr-0\\.5{padding-right:1.625px}.pr-1{padding-right:3.25px}.pr-2{padding-right:6.5px}.pr-\\[16px\\]{padding-right:16px}.pb-2{padding-bottom:6.5px}.pb-4{padding-bottom:13px}.pl-2{padding-left:6.5px}.pl-40{padding-left:130px}.pl-\\[4px\\]{padding-left:4px}.text-center{text-align:center}.text-left{text-align:left}.text-right{text-align:right}.font-mono{font-family:var(--font-mono)}.text-sm{font-size:11.375px;line-height:var(--tw-leading,16.25px)}.text-sm\\!{font-size:11.375px!important;line-height:var(--tw-leading,16.25px)!important}.text-xs{font-size:9.75px;line-height:var(--tw-leading,13px)}.leading-5{--tw-leading:16.25px;line-height:16.25px}.leading-7{--tw-leading:22.75px;line-height:22.75px}.leading-10{--tw-leading:32.5px;line-height:32.5px}.font-medium{--tw-font-weight:var(--font-weight-medium);font-weight:var(--font-weight-medium)}.text-ellipsis{text-overflow:ellipsis}.whitespace-nowrap{white-space:nowrap}.\\!text-gray-200{color:var(--color-gray-200)!important}.\\!text-slate-100{color:var(--color-slate-100)!important}.text-blue-500{color:var(--color-blue-500)}.text-gray-400{color:var(--color-gray-400)}.text-red-400{color:var(--color-red-400)}.text-red-500{color:var(--color-red-500)}.text-red-600{color:var(--color-red-600)}.text-slate-300{color:var(--color-slate-300)}.text-slate-400{color:var(--color-slate-400)}.text-slate-500{color:var(--color-slate-500)}.text-slate-600{color:var(--color-slate-600)}.text-slate-700{color:var(--color-slate-700)}.text-slate-800{color:var(--color-slate-800)}.text-white{color:var(--color-white)}.ordinal{--tw-ordinal:ordinal;font-variant-numeric:var(--tw-ordinal,)var(--tw-slashed-zero,)var(--tw-numeric-figure,)var(--tw-numeric-spacing,)var(--tw-numeric-fraction,)}.underline{text-decoration-line:underline}.opacity-0{opacity:0}.opacity-20{opacity:.2}.shadow-lg{--tw-shadow:0 10px 15px -3px var(--tw-shadow-color,#0000001a),0 4px 6px -4px var(--tw-shadow-color,#0000001a);box-shadow:var(--tw-inset-shadow),var(--tw-inset-ring-shadow),var(--tw-ring-offset-shadow),var(--tw-ring-shadow),var(--tw-shadow)}.shadow-md{--tw-shadow:0 4px 6px -1px var(--tw-shadow-color,#0000001a),0 2px 4px -2px var(--tw-shadow-color,#0000001a);box-shadow:var(--tw-inset-shadow),var(--tw-inset-ring-shadow),var(--tw-ring-offset-shadow),var(--tw-ring-shadow),var(--tw-shadow)}.-outline-offset-1{outline-offset:-1px}.-outline-offset-2{outline-offset:-2px}.outline-blue-600{outline-color:var(--color-blue-600)}.invert{--tw-invert:invert(100%);filter:var(--tw-blur,)var(--tw-brightness,)var(--tw-contrast,)var(--tw-grayscale,)var(--tw-hue-rotate,)var(--tw-invert,)var(--tw-saturate,)var(--tw-sepia,)var(--tw-drop-shadow,)}.filter{filter:var(--tw-blur,)var(--tw-brightness,)var(--tw-contrast,)var(--tw-grayscale,)var(--tw-hue-rotate,)var(--tw-invert,)var(--tw-saturate,)var(--tw-sepia,)var(--tw-drop-shadow,)}.transition-all{transition-property:all;transition-timing-function:var(--tw-ease,var(--default-transition-timing-function));transition-duration:var(--tw-duration,var(--default-transition-duration))}.transition-opacity{transition-property:opacity;transition-timing-function:var(--tw-ease,var(--default-transition-timing-function));transition-duration:var(--tw-duration,var(--default-transition-duration))}.ease-in-out{--tw-ease:var(--ease-in-out);transition-timing-function:var(--ease-in-out)}.select-none{-webkit-user-select:none;user-select:none}@media (hover:hover){.group-hover\\:bg-blue-600:is(:where(.group):hover *){background-color:var(--color-blue-600)}.group-hover\\:opacity-100:is(:where(.group):hover *){opacity:1}}.first\\:rounded-tl-md:first-child{border-top-left-radius:4.875px}.first\\:rounded-bl-md:first-child{border-bottom-left-radius:4.875px}.last\\:rounded-tr-md:last-child{border-top-right-radius:4.875px}.last\\:rounded-br-md:last-child{border-bottom-right-radius:4.875px}@media (hover:hover){.hover\\:border-slate-500:hover{border-color:var(--color-slate-500)}.hover\\:bg-red-500:hover{background-color:var(--color-red-500)}.hover\\:bg-slate-200:hover{background-color:var(--color-slate-200)}.hover\\:bg-slate-300:hover{background-color:var(--color-slate-300)}.hover\\:bg-white:hover{background-color:var(--color-white)}.hover\\:text-slate-500:hover{color:var(--color-slate-500)}.hover\\:text-slate-800:hover{color:var(--color-slate-800)}.hover\\:text-slate-900:hover{color:var(--color-slate-900)}.hover\\:text-white:hover{color:var(--color-white)}}.focus-visible\\:outline-2:focus-visible{outline-style:var(--tw-outline-style);outline-width:2px}.dark\\:\\!border-blue-600:where(.dark,.dark *){border-color:var(--color-blue-600)!important}.dark\\:\\!border-slate-400:where(.dark,.dark *){border-color:var(--color-slate-400)!important}.dark\\:border-slate-500:where(.dark,.dark *){border-color:var(--color-slate-500)}.dark\\:border-slate-600:where(.dark,.dark *){border-color:var(--color-slate-600)}.dark\\:border-slate-700:where(.dark,.dark *){border-color:var(--color-slate-700)}.dark\\:\\!bg-blue-800:where(.dark,.dark *){background-color:var(--color-blue-800)!important}.dark\\:\\!bg-slate-600:where(.dark,.dark *){background-color:var(--color-slate-600)!important}.dark\\:bg-black:where(.dark,.dark *){background-color:var(--color-black)}.dark\\:bg-black\\/25:where(.dark,.dark *){background-color:#00000040}@supports (color:color-mix(in lab,red,red)){.dark\\:bg-black\\/25:where(.dark,.dark *){background-color:color-mix(in oklab,var(--color-black)25%,transparent)}}.dark\\:bg-gray-600:where(.dark,.dark *){background-color:var(--color-gray-600)}.dark\\:bg-slate-500:where(.dark,.dark *){background-color:var(--color-slate-500)}.dark\\:bg-slate-600:where(.dark,.dark *){background-color:var(--color-slate-600)}.dark\\:bg-slate-700:where(.dark,.dark *){background-color:var(--color-slate-700)}.dark\\:bg-slate-800:where(.dark,.dark *){background-color:var(--color-slate-800)}.dark\\:bg-slate-900:where(.dark,.dark *){background-color:var(--color-slate-900)}.dark\\:\\!text-gray-600:where(.dark,.dark *){color:var(--color-gray-600)!important}.dark\\:text-gray-400:where(.dark,.dark *){color:var(--color-gray-400)}.dark\\:text-slate-200:where(.dark,.dark *){color:var(--color-slate-200)}.dark\\:text-slate-300:where(.dark,.dark *){color:var(--color-slate-300)}.dark\\:text-slate-400:where(.dark,.dark *){color:var(--color-slate-400)}.dark\\:text-slate-500:where(.dark,.dark *){color:var(--color-slate-500)}.dark\\:text-slate-600:where(.dark,.dark *){color:var(--color-slate-600)}@media (hover:hover){.dark\\:group-hover\\:bg-blue-400:where(.dark,.dark *):is(:where(.group):hover *){background-color:var(--color-blue-400)}.dark\\:hover\\:border-slate-300:where(.dark,.dark *):hover{border-color:var(--color-slate-300)}.dark\\:hover\\:bg-slate-500:where(.dark,.dark *):hover{background-color:var(--color-slate-500)}.dark\\:hover\\:bg-slate-600:where(.dark,.dark *):hover{background-color:var(--color-slate-600)}.dark\\:hover\\:bg-slate-700:where(.dark,.dark *):hover{background-color:var(--color-slate-700)}.dark\\:hover\\:text-slate-100:where(.dark,.dark *):hover{color:var(--color-slate-100)}.dark\\:hover\\:text-slate-200:where(.dark,.dark *):hover{color:var(--color-slate-200)}.dark\\:hover\\:text-slate-300:where(.dark,.dark *):hover{color:var(--color-slate-300)}.dark\\:hover\\:text-slate-400:where(.dark,.dark *):hover{color:var(--color-slate-400)}}}.prism-code-editor{background:var(--editor__bg);--_pse:var(--padding-inline,.75em);--_ns:var(--number-spacing,.75em);--padding-left:var(--_pse);--_sp:var(--pce-scroll-padding,2ch);scroll-padding:var(--_sp);-webkit-user-select:none;user-select:none;isolation:isolate;white-space:pre;line-height:1.4;display:grid;overflow:auto}.show-line-numbers{--padding-left:calc(var(--_pse) + var(--number-width) + var(--_ns));scroll-padding-left:calc(var(--padding-left) + var(--_sp));grid:1fr/0 1fr}.pce-wrapper{pointer-events:none;-webkit-text-size-adjust:none;-moz-text-size-adjust:none;text-size-adjust:none;margin:.5em 0;position:relative}.pce-textarea{all:unset;box-sizing:border-box;color:#0000;-webkit-user-select:auto;user-select:auto;pointer-events:auto;width:100%;height:100%;overflow:hidden}.pce-textarea::selection{background:var(--pce-selection);color:#0000}.pce-no-selection textarea:focus{z-index:1}.pce-line,.pce-textarea{padding:0 var(--_pse)0 var(--padding-left);position:relative}.show-line-numbers .pce-line:before{content:attr(data-line);margin:0 0 0 calc(-1*var(--padding-left));padding:0 var(--_ns)0 0;box-sizing:border-box;color:var(--editor__line-number);text-align:end;display:inline-block}.show-line-numbers:before{content:"";background:inherit;pointer-events:none}.show-line-numbers:before,.pce-line:before{z-index:2;height:100%;width:var(--padding-left);position:sticky;left:0}.pce-wrap .pce-line:before{margin:0;position:absolute}.pce-overlays,.pce-overlays>*,pre.pce-guides .pce-line:after,.pce-no-selection .active-line:after,.active-line.match-highlight:after{content:"";position:absolute;inset:0}.show-line-numbers .pce-line:after{left:var(--padding-left)}.active-line:after{border:var(--editor__border-highlight);background:var(--editor__bg-highlight);z-index:-2}.pce-wrap{white-space:pre-wrap;word-break:break-word}.selection-matches span{background:var(--editor__bg-selection-match)}.pce-nowrap .active-bracket{display:inline-block}@media (hover:hover){.prism-code-editor::-webkit-scrollbar-corner{background:0 0}.prism-code-editor::-webkit-scrollbar-track{background:0 0}.prism-code-editor ::-webkit-scrollbar-corner{background:0 0}.prism-code-editor ::-webkit-scrollbar-track{background:0 0}.prism-code-editor::-webkit-scrollbar{width:1em;height:1em}.prism-code-editor ::-webkit-scrollbar{width:1em;height:1em}.prism-code-editor::-webkit-scrollbar-thumb{background:hsla(var(--editor__bg-scrollbar),.36);width:2em;height:2em}.prism-code-editor ::-webkit-scrollbar-thumb{background:hsla(var(--editor__bg-scrollbar),.36);width:2em;height:2em}.prism-code-editor::-webkit-scrollbar-thumb:hover{background:hsla(var(--editor__bg-scrollbar),.5)}.prism-code-editor ::-webkit-scrollbar-thumb:hover{background:hsla(var(--editor__bg-scrollbar),.5)}.prism-code-editor::-webkit-scrollbar-thumb:active{background:hsla(var(--editor__bg-scrollbar),.66)}.prism-code-editor ::-webkit-scrollbar-thumb:active{background:hsla(var(--editor__bg-scrollbar),.66)}}.form-input,.form-textarea,.form-select,.form-multiselect{font-size:13px;line-height:19.5px}mark{background-color:#f9ceaf}.markdown-content{line-height:1.2em}.markdown-content a{text-decoration:underline}.markdown-content pre,.markdown-content code{font-family:Menlo,monospace;font-size:11px}.markdown-content pre{margin-bottom:.5em}.markdown-content h1,.markdown-content h2,.markdown-content h3,.markdown-content h4{margin-bottom:.5em;font-weight:700}.markdown-content p{margin-bottom:.5em;list-style:outside}.markdown-content ul{margin-bottom:.5em;margin-left:2em;list-style:outside}.markdown-content ol{margin-bottom:.5em;margin-left:2em;list-style:decimal}.code-editor-light .prism-code-editor{caret-color:#24292e;--editor__bg:#fff;--widget__border:#bfbfbf;--widget__bg:#f6f8fa;--widget__color:#434d56;--widget__color-active:#000;--widget__color-options:#5a6772;--widget__bg-input:#fafbfc;--widget__bg-hover:#b8b8b84f;--widget__bg-active:#2188ff33;--widget__focus-ring:#007acc;--search__bg-find:#ffdf5d66;--widget__bg-error:#f2dede;--widget__error-ring:#be1100;--editor__bg-highlight:#f6f8fa;--editor__bg-selection-match:#34d05840;--editor__line-number:#1b1f2380;--editor__bg-scrollbar:210,7%,55%;--editor__bg-fold:#656d76;--bg-guide-indent:#1f23281f;--pce-ac-icon-class:#953800;--pce-ac-icon-constant:#116329;--pce-ac-icon-enum:#953800;--pce-ac-icon-event:#57606a;--pce-ac-icon-function:#6639ba;--pce-ac-icon-interface:#953800;--pce-ac-icon-keyword:#a40e26;--pce-ac-icon-namespace:#a40e26;--pce-ac-icon-parameter:#0a3069;--pce-ac-icon-property:#953800;--pce-ac-icon-snippet:#0550ae;--pce-ac-icon-text:#0a3069;--pce-ac-icon-unit:#0550ae;--pce-ac-icon-variable:#953800;--pce-ac-match:#0066bf;--pce-tabstop:#0a326433;--pce-invisibles:#3333;--pce-selection:#add6ff;color-scheme:light;font-family:Consolas,Monaco,Andale Mono,Ubuntu Mono,monospace}.code-editor-light .pce-match{--search__bg-find:#e9e5ba}.code-editor-light .active-line{--editor__line-number:#1f2328}.code-editor-light .active-indent{--bg-guide-indent:#1f23284d}.code-editor-light [class*=language-],.code-editor-light .language-markdown .url>.operator,.code-editor-light .token.attr-equals,.code-editor-light .token.punctuation{color:#24292e}.code-editor-light .token.atrule,.code-editor-light .token.variable,.code-editor-light .language-css .token.url,.code-editor-light .token.parameter,.code-editor-light .token.list.punctuation,.code-editor-light .token.maybe-class-name,.code-editor-light .token.class-name{color:#e36209}.code-editor-light .token.keyword,.code-editor-light .token.atrule .rule,.code-editor-light .token.unit,.code-editor-light .token.deleted,.code-editor-light .token.entity,.code-editor-light .token.selector .combinator,.code-editor-light .token.regex-flags,.code-editor-light .token.token.anchor,.code-editor-light .token.number.quantifier,.code-editor-light .token.operator{color:#d73a49}.code-editor-light .token.tag,.code-editor-light .token.inserted,.code-editor-light .token.selector,.code-editor-light .token.doctype-tag,.code-editor-light .language-regex .escape{color:#22863a}.code-editor-light .token.selector .class,.code-editor-light .token.selector .id,.code-editor-light .token.pseudo-class,.code-editor-light .token.pseudo-element,.code-editor-light .token.function{color:#6f42c1}.code-editor-light .token.attr-value,.code-editor-light .token.string,.code-editor-light .token.char,.code-editor-light .token.regex,.code-editor-light .language-regex,.code-editor-light .token.string-property,.code-editor-light .language-markdown .url .content,.code-editor-light .language-markdown .url .variable{color:#032f62}.code-editor-light .token.code.keyword{color:#24292e}.code-editor-light .token.attr-name,.code-editor-light .language-css .token.property,.code-editor-light .token.number,.code-editor-light .token.constant,.code-editor-light .token.color,.code-editor-light .token.boolean,.code-editor-light .token.title.important,.code-editor-light .title.important .punctuation,.code-editor-light .token.property-access,.code-editor-light .token.char-class,.code-editor-light .token.char-set,.code-editor-light .token.doctype,.code-editor-light .token.builtin,.code-editor-light .token.regex .punctuation,.code-editor-light .language-css .token.function,.code-editor-light .token.code-snippet.code{color:#005cc5}.code-editor-light .token.comment,.code-editor-light .token.prolog,.code-editor-light .token.cdata{color:#6a737d}.code-editor-light .token.important,.code-editor-light .token.bold{font-weight:700}.code-editor-light .token.italic{font-style:italic}.code-editor-light .token.bracket-level-0,.code-editor-light .token.bracket-level-6{color:#0366d6}.code-editor-light .token.bracket-level-1,.code-editor-light .token.bracket-level-7{color:#138934}.code-editor-light .token.bracket-level-2,.code-editor-light .token.bracket-level-8{color:#b37700}.code-editor-light .token.bracket-level-3,.code-editor-light .token.bracket-level-9{color:#cb2431}.code-editor-light .token.bracket-level-4,.code-editor-light .token.bracket-level-10{color:#a43276}.code-editor-light .token.bracket-level-5,.code-editor-light .token.bracket-level-11{color:#8a3ddb}.code-editor-light .token.interpolation-punctuation{color:#032f62}.code-editor-light .token.bracket-error{color:#ff1212cc}.code-editor-light .token.markup-bracket{color:inherit}.code-editor-light .active-bracket{box-shadow:inset 0 0 0 1px #34d05899,inset 0 0 0 9in #35d05940}.code-editor-light .active-tagname,.code-editor-light .word-matches span{box-shadow:inset 0 0 0 1px #afb8c199,inset 0 0 0 9in #eaeef280}.code-editor-dark .prism-code-editor{caret-color:#2f81f7;--editor__bg:#0d1117;--widget__border:#303741;--widget__bg:#161b22;--widget__color:#b8bfc7;--widget__color-active:#fff;--widget__color-options:#7d8590;--widget__bg-input:#0d1117;--widget__bg-hover:#5a5d5e4f;--widget__bg-active:#1f6feb66;--widget__focus-ring:#007acc;--search__bg-find:#f2cc6080;--widget__bg-error:#5a1d1d;--widget__error-ring:#be1100;--editor__bg-highlight:#6e76811a;--editor__bg-selection-match:#3fb95040;--editor__line-number:#6e7681;--editor__bg-scrollbar:210,10%,32%;--editor__bg-fold:#7d8590;--bg-guide-indent:#e6edf31f;--pce-ac-icon-class:#f0883e;--pce-ac-icon-enum:#f0883e;--pce-ac-icon-event:#6e7681;--pce-ac-icon-function:#bc8cff;--pce-ac-icon-interface:#f0883e;--pce-ac-icon-keyword:#ff7b72;--pce-ac-icon-namespace:#ff7b72;--pce-ac-icon-parameter:#79c0ff;--pce-ac-icon-property:#f0883e;--pce-ac-icon-snippet:#58a6ff;--pce-ac-icon-text:#79c0ff;--pce-ac-icon-unit:#58a6ff;--pce-ac-icon-variable:#f0883e;--pce-selection:#264f78;color-scheme:dark;font-family:Consolas,Monaco,Andale Mono,Ubuntu Mono,monospace}.code-editor-dark .pce-match{--search__bg-find:#8c8d6c}.code-editor-dark .active-line{--editor__line-number:#e6edf3}.code-editor-dark .active-indent{--bg-guide-indent:#e6edf33d}.code-editor-dark [class*=language-],.code-editor-dark .language-markdown .url>.operator,.code-editor-dark .token.punctuation,.code-editor-dark .token.attr-equals,.code-editor-dark .token.code.keyword{color:#e6edf3}.code-editor-dark .token.atrule,.code-editor-dark .token.variable,.code-editor-dark .language-css .token.url,.code-editor-dark .token.parameter,.code-editor-dark .token.list.punctuation,.code-editor-dark .token.class-name,.code-editor-dark .token.maybe-class-name{color:#ffa657}.code-editor-dark .token.atrule .rule,.code-editor-dark .token.unit,.code-editor-dark .token.selector .combinator,.code-editor-dark .token.operator,.code-editor-dark .token.deleted,.code-editor-dark .token.entity,.code-editor-dark .token.regex-flags,.code-editor-dark .token.token.anchor,.code-editor-dark .token.number.quantifier,.code-editor-dark .token.keyword{color:#ff7b72}.code-editor-dark .token.tag,.code-editor-dark .token.inserted,.code-editor-dark .token.selector,.code-editor-dark .token.doctype-tag,.code-editor-dark .language-regex .escape{color:#7ee787}.code-editor-dark .token.attr-value,.code-editor-dark .token.string,.code-editor-dark .token.char,.code-editor-dark .token.regex,.code-editor-dark .language-regex,.code-editor-dark .token.string-property,.code-editor-dark .language-markdown .url .content,.code-editor-dark .language-markdown .url .variable{color:#a5d6ff}.code-editor-dark .token.builtin,.code-editor-dark .token.selector .class,.code-editor-dark .token.selector .id,.code-editor-dark .token.pseudo-class,.code-editor-dark .token.pseudo-element,.code-editor-dark .token.attr-name,.code-editor-dark .language-css .token.property,.code-editor-dark .token.number,.code-editor-dark .token.color,.code-editor-dark .token.boolean,.code-editor-dark .token.constant,.code-editor-dark .token.title.important,.code-editor-dark .title.important .punctuation,.code-editor-dark .language-css .token.function,.code-editor-dark .token.code-snippet.code,.code-editor-dark .token.doctype,.code-editor-dark .token.property-access,.code-editor-dark .token.keyword-null,.code-editor-dark .token.keyword-this,.code-editor-dark .token.char-class,.code-editor-dark .token.char-set,.code-editor-dark .token.regex .punctuation{color:#79c0ff}.code-editor-dark .token.function{color:#d2a8ff}.code-editor-dark .token.comment,.code-editor-dark .token.prolog,.code-editor-dark .token.cdata{color:#8b949e}.code-editor-dark .token.important,.code-editor-dark .token.bold{font-weight:700}.code-editor-dark .token.italic{font-style:italic}.code-editor-dark .token.bracket-level-0,.code-editor-dark .token.bracket-level-6{color:#79c0ff}.code-editor-dark .token.bracket-level-1,.code-editor-dark .token.bracket-level-7{color:#56d364}.code-editor-dark .token.bracket-level-2,.code-editor-dark .token.bracket-level-8{color:#e3b341}.code-editor-dark .token.bracket-level-3,.code-editor-dark .token.bracket-level-9{color:#ffa198}.code-editor-dark .token.bracket-level-4,.code-editor-dark .token.bracket-level-10{color:#ff9bce}.code-editor-dark .token.bracket-level-5,.code-editor-dark .token.bracket-level-11{color:#d2a8ff}.code-editor-dark .token.interpolation-punctuation{color:#a5d6ff}.code-editor-dark .token.bracket-error{color:#7d8590}.code-editor-dark .token.markup-bracket{color:inherit}.code-editor-dark .active-bracket{box-shadow:inset 0 0 0 1px #3fb95099,inset 0 0 0 9in #3fb95040}.code-editor-dark .active-tagname,.code-editor-dark .word-matches span{box-shadow:inset 0 0 0 1px #6e768199,inset 0 0 0 9in #6e768180}@property --tw-rotate-x{syntax:"*";inherits:false}@property --tw-rotate-y{syntax:"*";inherits:false}@property --tw-rotate-z{syntax:"*";inherits:false}@property --tw-skew-x{syntax:"*";inherits:false}@property --tw-skew-y{syntax:"*";inherits:false}@property --tw-space-y-reverse{syntax:"*";inherits:false;initial-value:0}@property --tw-border-style{syntax:"*";inherits:false;initial-value:solid}@property --tw-leading{syntax:"*";inherits:false}@property --tw-font-weight{syntax:"*";inherits:false}@property --tw-ordinal{syntax:"*";inherits:false}@property --tw-slashed-zero{syntax:"*";inherits:false}@property --tw-numeric-figure{syntax:"*";inherits:false}@property --tw-numeric-spacing{syntax:"*";inherits:false}@property --tw-numeric-fraction{syntax:"*";inherits:false}@property --tw-shadow{syntax:"*";inherits:false;initial-value:0 0 #0000}@property --tw-shadow-color{syntax:"*";inherits:false}@property --tw-shadow-alpha{syntax:"<percentage>";inherits:false;initial-value:100%}@property --tw-inset-shadow{syntax:"*";inherits:false;initial-value:0 0 #0000}@property --tw-inset-shadow-color{syntax:"*";inherits:false}@property --tw-inset-shadow-alpha{syntax:"<percentage>";inherits:false;initial-value:100%}@property --tw-ring-color{syntax:"*";inherits:false}@property --tw-ring-shadow{syntax:"*";inherits:false;initial-value:0 0 #0000}@property --tw-inset-ring-color{syntax:"*";inherits:false}@property --tw-inset-ring-shadow{syntax:"*";inherits:false;initial-value:0 0 #0000}@property --tw-ring-inset{syntax:"*";inherits:false}@property --tw-ring-offset-width{syntax:"<length>";inherits:false;initial-value:0}@property --tw-ring-offset-color{syntax:"*";inherits:false;initial-value:#fff}@property --tw-ring-offset-shadow{syntax:"*";inherits:false;initial-value:0 0 #0000}@property --tw-blur{syntax:"*";inherits:false}@property --tw-brightness{syntax:"*";inherits:false}@property --tw-contrast{syntax:"*";inherits:false}@property --tw-grayscale{syntax:"*";inherits:false}@property --tw-hue-rotate{syntax:"*";inherits:false}@property --tw-invert{syntax:"*";inherits:false}@property --tw-opacity{syntax:"*";inherits:false}@property --tw-saturate{syntax:"*";inherits:false}@property --tw-sepia{syntax:"*";inherits:false}@property --tw-drop-shadow{syntax:"*";inherits:false}@property --tw-drop-shadow-color{syntax:"*";inherits:false}@property --tw-drop-shadow-alpha{syntax:"<percentage>";inherits:false;initial-value:100%}@property --tw-drop-shadow-size{syntax:"*";inherits:false}@property --tw-ease{syntax:"*";inherits:false}@property --tw-outline-style{syntax:"*";inherits:false;initial-value:solid}`;
class Kj {
  component;
  container;
  currentProps;
  constructor(e, r) {
    this.currentProps = { ...r }, this.container = document.createElement("div"), this.container.style.display = "flex", this.container.style.width = "100%", this.container.style.height = "100%", e.appendChild(this.container);
    let n = this.container.attachShadow({ mode: "open" }), a = document.createElement("style");
    a.innerText = Aj, n.appendChild(a);
    let o = document.createElement("div");
    o.style.display = "flex", o.style.width = "100%", o.style.height = "100%", n.appendChild(o), this.component = Vw({ component: Bj, target: o, props: r });
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
async function Jj(t, e, r = []) {
  let n = new Zk(t, e), a = await n.columnDescriptions();
  return n.defaultPlots(a.filter((o) => r.indexOf(o.name) < 0));
}
export {
  Kj as EmbeddingAtlas,
  Jj as defaultPlots
};
