import { MosaicClient as yf, queryFieldInfo as iy, coordinator as oy } from "@uwdata/mosaic-core";
import { Query as so, eq as ly, column as Yn, literal as uy, cast as Ec, row_number as ay, desc as sy, count as cy } from "@uwdata/mosaic-sql";
const Rr = 2, ju = 4, Au = 8, ui = 16, de = 32, Ye = 64, bf = 128, Wr = 256, co = 512, Yt = 1024, Lr = 2048, Oe = 4096, Ur = 8192, Ze = 16384, Ou = 32768, mo = 65536, jc = 1 << 17, fy = 1 << 18, Hu = 1 << 19, _f = 1 << 20, wu = 1 << 21, Mu = 1 << 22, Fe = 1 << 23, Be = Symbol("$state"), xf = Symbol("legacy props"), hy = Symbol(""), Du = new class extends Error {
  name = "StaleReactionError";
  message = "The reaction that called `getAbortSignal()` was re-run or destroyed";
}(), Rf = 3, ti = 8, vy = !1;
var wo = Array.isArray, dy = Array.prototype.indexOf, Iu = Array.from, fo = Object.defineProperty, wn = Object.getOwnPropertyDescriptor, Cf = Object.getOwnPropertyDescriptors, kf = Object.prototype, gy = Array.prototype, yo = Object.getPrototypeOf, Ac = Object.isExtensible;
const py = () => {
};
function Sf(o) {
  for (var e = 0; e < o.length; e++)
    o[e]();
}
function my() {
  var o, e, i = new Promise((u, s) => {
    o = u, e = s;
  });
  return { promise: i, resolve: o, reject: e };
}
function zf(o) {
  return o === this.v;
}
function Wu(o, e) {
  return o != o ? e == e : o !== e || o !== null && typeof o == "object" || typeof o == "function";
}
function wy(o, e) {
  return o !== e;
}
function Pf(o) {
  return !Wu(o, this.v);
}
function yy() {
  throw new Error("https://svelte.dev/e/await_outside_boundary");
}
function Ef(o) {
  throw new Error("https://svelte.dev/e/lifecycle_outside_component");
}
function by() {
  throw new Error("https://svelte.dev/e/async_derived_orphan");
}
function _y(o) {
  throw new Error("https://svelte.dev/e/effect_in_teardown");
}
function xy() {
  throw new Error("https://svelte.dev/e/effect_in_unowned_derived");
}
function Ry(o) {
  throw new Error("https://svelte.dev/e/effect_orphan");
}
function Cy() {
  throw new Error("https://svelte.dev/e/effect_update_depth_exceeded");
}
function ky() {
  throw new Error("https://svelte.dev/e/hydration_failed");
}
function Sy() {
  throw new Error("https://svelte.dev/e/state_descriptors_fixed");
}
function zy() {
  throw new Error("https://svelte.dev/e/state_prototype_fixed");
}
function Py() {
  throw new Error("https://svelte.dev/e/state_unsafe_mutation");
}
let ai = !1, Ey = !1;
function jy() {
  ai = !0;
}
const Lu = 1, Tu = 2, jf = 4, Ay = 8, Oy = 16, Hy = 1, My = 2, Af = "[", Nu = "[!", $u = "]", yn = {}, Bt = Symbol(), Dy = "http://www.w3.org/1999/xhtml", Iy = [];
function Of(o, e = !1) {
  return oo(o, /* @__PURE__ */ new Map(), "", Iy);
}
function oo(o, e, i, u, s = null) {
  if (typeof o == "object" && o !== null) {
    var c = e.get(o);
    if (c !== void 0) return c;
    if (o instanceof Map) return (
      /** @type {Snapshot<T>} */
      new Map(o)
    );
    if (o instanceof Set) return (
      /** @type {Snapshot<T>} */
      new Set(o)
    );
    if (wo(o)) {
      var v = (
        /** @type {Snapshot<any>} */
        Array(o.length)
      );
      e.set(o, v), s !== null && e.set(s, v);
      for (var w = 0; w < o.length; w += 1) {
        var p = o[w];
        w in o && (v[w] = oo(p, e, i, u));
      }
      return v;
    }
    if (yo(o) === kf) {
      v = {}, e.set(o, v), s !== null && e.set(s, v);
      for (var y in o)
        v[y] = oo(o[y], e, i, u);
      return v;
    }
    if (o instanceof Date)
      return (
        /** @type {Snapshot<T>} */
        structuredClone(o)
      );
    if (typeof /** @type {T & { toJSON?: any } } */
    o.toJSON == "function")
      return oo(
        /** @type {T & { toJSON(): any } } */
        o.toJSON(),
        e,
        i,
        u,
        // Associate the instance with the toJSON clone
        o
      );
  }
  if (o instanceof EventTarget)
    return (
      /** @type {Snapshot<T>} */
      o
    );
  try {
    return (
      /** @type {Snapshot<T>} */
      structuredClone(o)
    );
  } catch {
    return (
      /** @type {Snapshot<T>} */
      o
    );
  }
}
let At = null;
function ho(o) {
  At = o;
}
function fr(o) {
  return (
    /** @type {T} */
    Hf().get(o)
  );
}
function Mr(o, e) {
  return Hf().set(o, e), e;
}
function Dt(o, e = !1, i) {
  At = {
    p: At,
    c: null,
    e: null,
    s: o,
    x: null,
    l: ai && !e ? { s: null, u: null, $: [] } : null
  };
}
function It(o) {
  var e = (
    /** @type {ComponentContext} */
    At
  ), i = e.e;
  if (i !== null) {
    e.e = null;
    for (var u of i)
      nh(u);
  }
  return At = e.p, /** @type {T} */
  {};
}
function Cn() {
  return !ai || At !== null && At.l === null;
}
function Hf(o) {
  return At === null && Ef(), At.c ??= new Map(Wy(At) || void 0);
}
function Wy(o) {
  let e = o.p;
  for (; e !== null; ) {
    const i = e.c;
    if (i !== null)
      return i;
    e = e.p;
  }
  return null;
}
function bo(o) {
  console.warn("https://svelte.dev/e/hydration_mismatch");
}
let vt = !1;
function he(o) {
  vt = o;
}
let xt;
function Xr(o) {
  if (o === null)
    throw bo(), yn;
  return xt = o;
}
function si() {
  return Xr(
    /** @type {TemplateNode} */
    /* @__PURE__ */ He(xt)
  );
}
function ht(o) {
  if (vt) {
    if (/* @__PURE__ */ He(xt) !== null)
      throw bo(), yn;
    xt = o;
  }
}
function yu() {
  for (var o = 0, e = xt; ; ) {
    if (e.nodeType === ti) {
      var i = (
        /** @type {Comment} */
        e.data
      );
      if (i === $u) {
        if (o === 0) return e;
        o -= 1;
      } else (i === Af || i === Nu) && (o += 1);
    }
    var u = (
      /** @type {TemplateNode} */
      /* @__PURE__ */ He(e)
    );
    e.remove(), e = u;
  }
}
function Mf(o) {
  if (!o || o.nodeType !== ti)
    throw bo(), yn;
  return (
    /** @type {Comment} */
    o.data
  );
}
function Zt(o) {
  if (typeof o != "object" || o === null || Be in o)
    return o;
  const e = yo(o);
  if (e !== kf && e !== gy)
    return o;
  var i = /* @__PURE__ */ new Map(), u = wo(o), s = /* @__PURE__ */ F(0), c = Xe, v = (w) => {
    if (Xe === c)
      return w();
    var p = st, y = Xe;
    Jr(null), Ic(c);
    var x = w();
    return Jr(p), Ic(y), x;
  };
  return u && i.set("length", /* @__PURE__ */ F(
    /** @type {any[]} */
    o.length
  )), new Proxy(
    /** @type {any} */
    o,
    {
      defineProperty(w, p, y) {
        (!("value" in y) || y.configurable === !1 || y.enumerable === !1 || y.writable === !1) && Sy();
        var x = i.get(p);
        return x === void 0 ? x = v(() => {
          var S = /* @__PURE__ */ F(y.value);
          return i.set(p, S), S;
        }) : A(x, y.value, !0), !0;
      },
      deleteProperty(w, p) {
        var y = i.get(p);
        if (y === void 0) {
          if (p in w) {
            const x = v(() => /* @__PURE__ */ F(Bt));
            i.set(p, x), Yl(s);
          }
        } else
          A(y, Bt), Yl(s);
        return !0;
      },
      get(w, p, y) {
        if (p === Be)
          return o;
        var x = i.get(p), S = p in w;
        if (x === void 0 && (!S || wn(w, p)?.writable) && (x = v(() => {
          var E = Zt(S ? w[p] : Bt), k = /* @__PURE__ */ F(E);
          return k;
        }), i.set(p, x)), x !== void 0) {
          var z = d(x);
          return z === Bt ? void 0 : z;
        }
        return Reflect.get(w, p, y);
      },
      getOwnPropertyDescriptor(w, p) {
        var y = Reflect.getOwnPropertyDescriptor(w, p);
        if (y && "value" in y) {
          var x = i.get(p);
          x && (y.value = d(x));
        } else if (y === void 0) {
          var S = i.get(p), z = S?.v;
          if (S !== void 0 && z !== Bt)
            return {
              enumerable: !0,
              configurable: !0,
              value: z,
              writable: !0
            };
        }
        return y;
      },
      has(w, p) {
        if (p === Be)
          return !0;
        var y = i.get(p), x = y !== void 0 && y.v !== Bt || Reflect.has(w, p);
        if (y !== void 0 || lt !== null && (!x || wn(w, p)?.writable)) {
          y === void 0 && (y = v(() => {
            var z = x ? Zt(w[p]) : Bt, E = /* @__PURE__ */ F(z);
            return E;
          }), i.set(p, y));
          var S = d(y);
          if (S === Bt)
            return !1;
        }
        return x;
      },
      set(w, p, y, x) {
        var S = i.get(p), z = p in w;
        if (u && p === "length")
          for (var E = y; E < /** @type {Source<number>} */
          S.v; E += 1) {
            var k = i.get(E + "");
            k !== void 0 ? A(k, Bt) : E in w && (k = v(() => /* @__PURE__ */ F(Bt)), i.set(E + "", k));
          }
        if (S === void 0)
          (!z || wn(w, p)?.writable) && (S = v(() => /* @__PURE__ */ F(void 0)), A(S, Zt(y)), i.set(p, S));
        else {
          z = S.v !== Bt;
          var D = v(() => Zt(y));
          A(S, D);
        }
        var H = Reflect.getOwnPropertyDescriptor(w, p);
        if (H?.set && H.set.call(x, y), !z) {
          if (u && typeof p == "string") {
            var L = (
              /** @type {Source<number>} */
              i.get("length")
            ), I = Number(p);
            Number.isInteger(I) && I >= L.v && A(L, I + 1);
          }
          Yl(s);
        }
        return !0;
      },
      ownKeys(w) {
        d(s);
        var p = Reflect.ownKeys(w).filter((S) => {
          var z = i.get(S);
          return z === void 0 || z.v !== Bt;
        });
        for (var [y, x] of i)
          x.v !== Bt && !(y in w) && p.push(y);
        return p;
      },
      setPrototypeOf() {
        zy();
      }
    }
  );
}
var bu, Df, If, Wf;
function _u() {
  if (bu === void 0) {
    bu = window, Df = /Firefox/.test(navigator.userAgent);
    var o = Element.prototype, e = Node.prototype, i = Text.prototype;
    If = wn(e, "firstChild").get, Wf = wn(e, "nextSibling").get, Ac(o) && (o.__click = void 0, o.__className = void 0, o.__attributes = null, o.__style = void 0, o.__e = void 0), Ac(i) && (i.__t = void 0);
  }
}
function Pe(o = "") {
  return document.createTextNode(o);
}
// @__NO_SIDE_EFFECTS__
function Ke(o) {
  return If.call(o);
}
// @__NO_SIDE_EFFECTS__
function He(o) {
  return Wf.call(o);
}
function pt(o, e) {
  if (!vt)
    return /* @__PURE__ */ Ke(o);
  var i = (
    /** @type {TemplateNode} */
    /* @__PURE__ */ Ke(xt)
  );
  if (i === null)
    i = xt.appendChild(Pe());
  else if (e && i.nodeType !== Rf) {
    var u = Pe();
    return i?.before(u), Xr(u), u;
  }
  return Xr(i), i;
}
function Dr(o, e) {
  if (!vt) {
    var i = (
      /** @type {DocumentFragment} */
      /* @__PURE__ */ Ke(
        /** @type {Node} */
        o
      )
    );
    return i instanceof Comment && i.data === "" ? /* @__PURE__ */ He(i) : i;
  }
  return xt;
}
function Ir(o, e = 1, i = !1) {
  let u = vt ? xt : o;
  for (var s; e--; )
    s = u, u = /** @type {TemplateNode} */
    /* @__PURE__ */ He(u);
  if (!vt)
    return u;
  if (i && u?.nodeType !== Rf) {
    var c = Pe();
    return u === null ? s?.after(c) : u.before(c), Xr(c), c;
  }
  return Xr(u), /** @type {TemplateNode} */
  u;
}
function Lf(o) {
  o.textContent = "";
}
function Tf() {
  return !1;
}
const Ly = /* @__PURE__ */ new WeakMap();
function Ty(o) {
  var e = lt;
  if (e === null)
    return st.f |= Fe, o;
  if ((e.f & Ou) === 0) {
    if ((e.f & bf) === 0)
      throw !e.parent && o instanceof Error && Nf(o), o;
    e.b.error(o);
  } else
    qu(o, e);
}
function qu(o, e) {
  for (; e !== null; ) {
    if ((e.f & bf) !== 0)
      try {
        e.b.error(o);
        return;
      } catch (i) {
        o = i;
      }
    e = e.parent;
  }
  throw o instanceof Error && Nf(o), o;
}
function Nf(o) {
  const e = Ly.get(o);
  e && (fo(o, "message", {
    value: e.message
  }), fo(o, "stack", {
    value: e.stack
  }));
}
const Ny = typeof requestIdleCallback > "u" ? (o) => setTimeout(o, 1) : requestIdleCallback;
let ri = [], ei = [];
function $f() {
  var o = ri;
  ri = [], Sf(o);
}
function qf() {
  var o = ei;
  ei = [], Sf(o);
}
function Fu(o) {
  ri.length === 0 && queueMicrotask($f), ri.push(o);
}
function $y(o) {
  ei.length === 0 && Ny(qf), ei.push(o);
}
function qy() {
  ri.length > 0 && $f(), ei.length > 0 && qf();
}
function Fy() {
  for (var o = (
    /** @type {Effect} */
    lt.b
  ); o !== null && !o.has_pending_snippet(); )
    o = o.parent;
  return o === null && yy(), o;
}
// @__NO_SIDE_EFFECTS__
function _o(o) {
  var e = Rr | Lr, i = st !== null && (st.f & Rr) !== 0 ? (
    /** @type {Derived} */
    st
  ) : null;
  return lt === null || i !== null && (i.f & Wr) !== 0 ? e |= Wr : lt.f |= Hu, {
    ctx: At,
    deps: null,
    effects: null,
    equals: zf,
    f: e,
    fn: o,
    reactions: null,
    rv: 0,
    v: (
      /** @type {V} */
      Bt
    ),
    wv: 0,
    parent: i ?? lt,
    ac: null
  };
}
// @__NO_SIDE_EFFECTS__
function By(o, e) {
  let i = (
    /** @type {Effect | null} */
    lt
  );
  i === null && by();
  var u = (
    /** @type {Boundary} */
    i.b
  ), s = (
    /** @type {Promise<V>} */
    /** @type {unknown} */
    void 0
  ), c = ni(
    /** @type {V} */
    Bt
  ), v = null, w = !st;
  return ib(() => {
    try {
      var p = o();
    } catch (E) {
      p = Promise.reject(E);
    }
    var y = () => p;
    s = v?.then(y, y) ?? Promise.resolve(p), v = s;
    var x = (
      /** @type {Batch} */
      Wt
    ), S = u.pending;
    w && (u.update_pending_count(1), S || x.increment());
    const z = (E, k = void 0) => {
      v = null, S || x.activate(), k ? k !== Du && (c.f |= Fe, ii(c, k)) : ((c.f & Fe) !== 0 && (c.f ^= Fe), ii(c, E)), w && (u.update_pending_count(-1), S || x.decrement()), Xf();
    };
    if (s.then(z, (E) => z(null, E || "unknown")), x)
      return () => {
        queueMicrotask(() => x.neuter());
      };
  }), new Promise((p) => {
    function y(x) {
      function S() {
        x === s ? p(c) : y(s);
      }
      x.then(S, S);
    }
    y(s);
  });
}
// @__NO_SIDE_EFFECTS__
function M(o) {
  const e = /* @__PURE__ */ _o(o);
  return Zf(e), e;
}
// @__NO_SIDE_EFFECTS__
function Ff(o) {
  const e = /* @__PURE__ */ _o(o);
  return e.equals = Pf, e;
}
function Bf(o) {
  var e = o.effects;
  if (e !== null) {
    o.effects = null;
    for (var i = 0; i < e.length; i += 1)
      te(
        /** @type {Effect} */
        e[i]
      );
  }
}
function Uy(o) {
  for (var e = o.parent; e !== null; ) {
    if ((e.f & Rr) === 0)
      return (
        /** @type {Effect} */
        e
      );
    e = e.parent;
  }
  return null;
}
function Bu(o) {
  var e, i = lt;
  Ee(Uy(o));
  try {
    Bf(o), e = rh(o);
  } finally {
    Ee(i);
  }
  return e;
}
function Uf(o) {
  var e = Bu(o);
  if (o.equals(e) || (o.v = e, o.wv = Jf()), !Qe)
    if (xn !== null)
      xn.set(o, o.v);
    else {
      var i = (Se || (o.f & Wr) !== 0) && o.deps !== null ? Oe : Yt;
      hr(o, i);
    }
}
function Xy(o, e, i) {
  const u = Cn() ? _o : Ff;
  if (e.length === 0) {
    i(o.map(u));
    return;
  }
  var s = Wt, c = (
    /** @type {Effect} */
    lt
  ), v = Ky(), w = Fy();
  Promise.all(e.map((p) => /* @__PURE__ */ By(p))).then((p) => {
    s?.activate(), v();
    try {
      i([...o.map(u), ...p]);
    } catch (y) {
      (c.f & Ze) === 0 && qu(y, c);
    }
    s?.deactivate(), Xf();
  }).catch((p) => {
    w.error(p);
  });
}
function Ky() {
  var o = lt, e = st, i = At;
  return function() {
    Ee(o), Jr(e), ho(i);
  };
}
function Xf() {
  Ee(null), Jr(null), ho(null);
}
const Vn = /* @__PURE__ */ new Set();
let Wt = null, xn = null, Oc = /* @__PURE__ */ new Set(), vo = [];
function Kf() {
  const o = (
    /** @type {() => void} */
    vo.shift()
  );
  vo.length > 0 && queueMicrotask(Kf), o();
}
let Ge = [], xo = null, xu = !1, lo = !1;
class Rn {
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
  #t = /* @__PURE__ */ new Map();
  /**
   * When the batch is committed (and the DOM is updated), we need to remove old branches
   * and append new ones by calling the functions added inside (if/each/key/etc) blocks
   * @type {Set<() => void>}
   */
  #r = /* @__PURE__ */ new Set();
  /**
   * The number of async effects that are currently in flight
   */
  #e = 0;
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
  #l = !1;
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
  #o = [];
  /**
   * Template effects and `$effect.pre` effects, which run when
   * a batch is committed
   * @type {Effect[]}
   */
  #a = [];
  /**
   * The same as `#render_effects`, but for `$effect` (which runs after)
   * @type {Effect[]}
   */
  #u = [];
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
  #h = [];
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
    Ge = [];
    var i = null;
    if (Vn.size > 1) {
      i = /* @__PURE__ */ new Map(), xn = /* @__PURE__ */ new Map();
      for (const [c, v] of this.current)
        i.set(c, { v: c.v, wv: c.wv }), c.v = v;
      for (const c of Vn)
        if (c !== this)
          for (const [v, w] of c.#t)
            i.has(v) || (i.set(v, { v: v.v, wv: v.wv }), v.v = w);
    }
    for (const c of e)
      this.#d(c);
    if (this.#i.length === 0 && this.#e === 0) {
      this.#v();
      var u = this.#a, s = this.#u;
      this.#a = [], this.#u = [], this.#s = [], Wt = null, Hc(u), Hc(s), Wt === null ? Wt = this : Vn.delete(this), this.#n?.resolve();
    } else
      this.#c(this.#a), this.#c(this.#u), this.#c(this.#s);
    if (i) {
      for (const [c, { v, wv: w }] of i)
        c.wv <= w && (c.v = v);
      xn = null;
    }
    for (const c of this.#i)
      Qn(c);
    for (const c of this.#o)
      Qn(c);
    this.#i = [], this.#o = [];
  }
  /**
   * Traverse the effect tree, executing effects or stashing
   * them for later execution as appropriate
   * @param {Effect} root
   */
  #d(e) {
    e.f ^= Yt;
    for (var i = e.first; i !== null; ) {
      var u = i.f, s = (u & (de | Ye)) !== 0, c = s && (u & Yt) !== 0, v = c || (u & Ur) !== 0 || this.skipped_effects.has(i);
      if (!v && i.fn !== null) {
        if (s)
          i.f ^= Yt;
        else if ((u & Yt) === 0)
          if ((u & ju) !== 0)
            this.#u.push(i);
          else if ((u & Mu) !== 0) {
            var w = i.b?.pending ? this.#o : this.#i;
            w.push(i);
          } else Ro(i) && ((i.f & ui) !== 0 && this.#s.push(i), Qn(i));
        var p = i.first;
        if (p !== null) {
          i = p;
          continue;
        }
      }
      var y = i.parent;
      for (i = i.next; i === null && y !== null; )
        i = y.next, y = y.parent;
    }
  }
  /**
   * @param {Effect[]} effects
   */
  #c(e) {
    for (const i of e)
      ((i.f & Lr) !== 0 ? this.#f : this.#h).push(i), hr(i, Yt);
    e.length = 0;
  }
  /**
   * Associate a change to a given source with the current
   * batch, noting its previous and current values
   * @param {Source} source
   * @param {any} value
   */
  capture(e, i) {
    this.#t.has(e) || this.#t.set(e, i), this.current.set(e, e.v);
  }
  activate() {
    Wt = this;
  }
  deactivate() {
    Wt = null;
    for (const e of Oc)
      if (Oc.delete(e), e(), Wt !== null)
        break;
  }
  neuter() {
    this.#l = !0;
  }
  flush() {
    Ge.length > 0 ? Gf() : this.#v(), Wt === this && (this.#e === 0 && Vn.delete(this), this.deactivate());
  }
  /**
   * Append and remove branches to/from the DOM
   */
  #v() {
    if (!this.#l)
      for (const e of this.#r)
        e();
    this.#r.clear();
  }
  increment() {
    this.#e += 1;
  }
  decrement() {
    if (this.#e -= 1, this.#e === 0) {
      for (const e of this.#f)
        hr(e, Lr), Ve(e);
      for (const e of this.#h)
        hr(e, Oe), Ve(e);
      this.#a = [], this.#u = [], this.flush();
    } else
      this.deactivate();
  }
  /** @param {() => void} fn */
  add_callback(e) {
    this.#r.add(e);
  }
  settled() {
    return (this.#n ??= my()).promise;
  }
  static ensure() {
    if (Wt === null) {
      const e = Wt = new Rn();
      Vn.add(Wt), lo || Rn.enqueue(() => {
        Wt === e && e.flush();
      });
    }
    return Wt;
  }
  /** @param {() => void} task */
  static enqueue(e) {
    vo.length === 0 && queueMicrotask(Kf), vo.unshift(e);
  }
}
function Gy(o) {
  var e = lo;
  lo = !0;
  try {
    for (var i; ; ) {
      if (qy(), Ge.length === 0 && (Wt?.flush(), Ge.length === 0))
        return xo = null, /** @type {T} */
        i;
      Gf();
    }
  } finally {
    lo = e;
  }
}
function Gf() {
  var o = bn;
  xu = !0;
  try {
    var e = 0;
    for (Mc(!0); Ge.length > 0; ) {
      var i = Rn.ensure();
      if (e++ > 1e3) {
        var u, s;
        Vy();
      }
      i.process(Ge), Ue.clear();
    }
  } finally {
    xu = !1, Mc(o), xo = null;
  }
}
function Vy() {
  try {
    Cy();
  } catch (o) {
    qu(o, xo);
  }
}
function Hc(o) {
  var e = o.length;
  if (e !== 0) {
    for (var i = 0; i < e; ) {
      var u = o[i++];
      if ((u.f & (Ze | Ur)) === 0 && Ro(u)) {
        var s = Wt ? Wt.current.size : 0;
        if (Qn(u), u.deps === null && u.first === null && u.nodes_start === null && (u.teardown === null && u.ac === null ? uh(u) : u.fn = null), Wt !== null && Wt.current.size > s && (u.f & _f) !== 0)
          break;
      }
    }
    for (; i < e; )
      Ve(o[i++]);
  }
}
function Ve(o) {
  for (var e = xo = o; e.parent !== null; ) {
    e = e.parent;
    var i = e.f;
    if (xu && e === lt && (i & ui) !== 0)
      return;
    if ((i & (Ye | de)) !== 0) {
      if ((i & Yt) === 0) return;
      e.f ^= Yt;
    }
  }
  Ge.push(e);
}
const Ue = /* @__PURE__ */ new Map();
function ni(o, e) {
  var i = {
    f: 0,
    // TODO ideally we could skip this altogether, but it causes type errors
    v: o,
    reactions: null,
    equals: zf,
    rv: 0,
    wv: 0
  };
  return i;
}
// @__NO_SIDE_EFFECTS__
function F(o, e) {
  const i = ni(o);
  return Zf(i), i;
}
// @__NO_SIDE_EFFECTS__
function Vf(o, e = !1, i = !0) {
  const u = ni(o);
  return e || (u.equals = Pf), ai && i && At !== null && At.l !== null && (At.l.s ??= []).push(u), u;
}
function A(o, e, i = !1) {
  st !== null && // since we are untracking the function inside `$inspect.with` we need to add this check
  // to ensure we error if state is set inside an inspect effect
  (!Qr || (st.f & jc) !== 0) && Cn() && (st.f & (Rr | ui | Mu | jc)) !== 0 && !ve?.includes(o) && Py();
  let u = i ? Zt(e) : e;
  return ii(o, u);
}
function ii(o, e) {
  if (!o.equals(e)) {
    var i = o.v;
    Qe ? Ue.set(o, e) : Ue.set(o, i), o.v = e;
    var u = Rn.ensure();
    u.capture(o, i), (o.f & Rr) !== 0 && ((o.f & Lr) !== 0 && Bu(
      /** @type {Derived} */
      o
    ), hr(o, (o.f & Wr) === 0 ? Yt : Oe)), o.wv = Jf(), Yf(o, Lr), Cn() && lt !== null && (lt.f & Yt) !== 0 && (lt.f & (de | Ye)) === 0 && (Hr === null ? Yy([o]) : Hr.push(o));
  }
  return e;
}
function Yl(o) {
  A(o, o.v + 1);
}
function Yf(o, e) {
  var i = o.reactions;
  if (i !== null)
    for (var u = Cn(), s = i.length, c = 0; c < s; c++) {
      var v = i[c], w = v.f;
      if (!(!u && v === lt)) {
        var p = (w & Lr) === 0;
        p && hr(v, e), (w & Rr) !== 0 ? Yf(
          /** @type {Derived} */
          v,
          Oe
        ) : p && Ve(
          /** @type {Effect} */
          v
        );
      }
    }
}
let bn = !1;
function Mc(o) {
  bn = o;
}
let Qe = !1;
function Dc(o) {
  Qe = o;
}
let st = null, Qr = !1;
function Jr(o) {
  st = o;
}
let lt = null;
function Ee(o) {
  lt = o;
}
let ve = null;
function Zf(o) {
  st !== null && (ve === null ? ve = [o] : ve.push(o));
}
let nr = null, _r = 0, Hr = null;
function Yy(o) {
  Hr = o;
}
let Qf = 1, oi = 0, Xe = oi;
function Ic(o) {
  Xe = o;
}
let Se = !1;
function Jf() {
  return ++Qf;
}
function Ro(o) {
  var e = o.f;
  if ((e & Lr) !== 0)
    return !0;
  if ((e & Oe) !== 0) {
    var i = o.deps, u = (e & Wr) !== 0;
    if (i !== null) {
      var s, c, v = (e & co) !== 0, w = u && lt !== null && !Se, p = i.length;
      if ((v || w) && (lt === null || (lt.f & Ze) === 0)) {
        var y = (
          /** @type {Derived} */
          o
        ), x = y.parent;
        for (s = 0; s < p; s++)
          c = i[s], (v || !c?.reactions?.includes(y)) && (c.reactions ??= []).push(y);
        v && (y.f ^= co), w && x !== null && (x.f & Wr) === 0 && (y.f ^= Wr);
      }
      for (s = 0; s < p; s++)
        if (c = i[s], Ro(
          /** @type {Derived} */
          c
        ) && Uf(
          /** @type {Derived} */
          c
        ), c.wv > o.wv)
          return !0;
    }
    (!u || lt !== null && !Se) && hr(o, Yt);
  }
  return !1;
}
function th(o, e, i = !0) {
  var u = o.reactions;
  if (u !== null && !ve?.includes(o))
    for (var s = 0; s < u.length; s++) {
      var c = u[s];
      (c.f & Rr) !== 0 ? th(
        /** @type {Derived} */
        c,
        e,
        !1
      ) : e === c && (i ? hr(c, Lr) : (c.f & Yt) !== 0 && hr(c, Oe), Ve(
        /** @type {Effect} */
        c
      ));
    }
}
function rh(o) {
  var e = nr, i = _r, u = Hr, s = st, c = Se, v = ve, w = At, p = Qr, y = Xe, x = o.f;
  nr = /** @type {null | Value[]} */
  null, _r = 0, Hr = null, Se = (x & Wr) !== 0 && (Qr || !bn || st === null), st = (x & (de | Ye)) === 0 ? o : null, ve = null, ho(o.ctx), Qr = !1, Xe = ++oi, o.ac !== null && (o.ac.abort(Du), o.ac = null);
  try {
    o.f |= wu;
    var S = (
      /** @type {Function} */
      (0, o.fn)()
    ), z = o.deps;
    if (nr !== null) {
      var E;
      if (go(o, _r), z !== null && _r > 0)
        for (z.length = _r + nr.length, E = 0; E < nr.length; E++)
          z[_r + E] = nr[E];
      else
        o.deps = z = nr;
      if (!Se || // Deriveds that already have reactions can cleanup, so we still add them as reactions
      (x & Rr) !== 0 && /** @type {import('#client').Derived} */
      o.reactions !== null)
        for (E = _r; E < z.length; E++)
          (z[E].reactions ??= []).push(o);
    } else z !== null && _r < z.length && (go(o, _r), z.length = _r);
    if (Cn() && Hr !== null && !Qr && z !== null && (o.f & (Rr | Oe | Lr)) === 0)
      for (E = 0; E < /** @type {Source[]} */
      Hr.length; E++)
        th(
          Hr[E],
          /** @type {Effect} */
          o
        );
    return s !== null && s !== o && (oi++, Hr !== null && (u === null ? u = Hr : u.push(.../** @type {Source[]} */
    Hr))), (o.f & Fe) !== 0 && (o.f ^= Fe), S;
  } catch (k) {
    return Ty(k);
  } finally {
    o.f ^= wu, nr = e, _r = i, Hr = u, st = s, Se = c, ve = v, ho(w), Qr = p, Xe = y;
  }
}
function Zy(o, e) {
  let i = e.reactions;
  if (i !== null) {
    var u = dy.call(i, o);
    if (u !== -1) {
      var s = i.length - 1;
      s === 0 ? i = e.reactions = null : (i[u] = i[s], i.pop());
    }
  }
  i === null && (e.f & Rr) !== 0 && // Destroying a child effect while updating a parent effect can cause a dependency to appear
  // to be unused, when in fact it is used by the currently-updating parent. Checking `new_deps`
  // allows us to skip the expensive work of disconnecting and immediately reconnecting it
  (nr === null || !nr.includes(e)) && (hr(e, Oe), (e.f & (Wr | co)) === 0 && (e.f ^= co), Bf(
    /** @type {Derived} **/
    e
  ), go(
    /** @type {Derived} **/
    e,
    0
  ));
}
function go(o, e) {
  var i = o.deps;
  if (i !== null)
    for (var u = e; u < i.length; u++)
      Zy(o, i[u]);
}
function Qn(o) {
  var e = o.f;
  if ((e & Ze) === 0) {
    hr(o, Yt);
    var i = lt, u = bn;
    lt = o, bn = !0;
    try {
      (e & ui) !== 0 ? ob(o) : lh(o), oh(o);
      var s = rh(o);
      o.teardown = typeof s == "function" ? s : null, o.wv = Qf;
      var c;
      vy && Ey && (o.f & Lr) !== 0 && o.deps;
    } finally {
      bn = u, lt = i;
    }
  }
}
function d(o) {
  var e = o.f, i = (e & Rr) !== 0;
  if (st !== null && !Qr) {
    var u = lt !== null && (lt.f & Ze) !== 0;
    if (!u && !ve?.includes(o)) {
      var s = st.deps;
      if ((st.f & wu) !== 0)
        o.rv < oi && (o.rv = oi, nr === null && s !== null && s[_r] === o ? _r++ : nr === null ? nr = [o] : (!Se || !nr.includes(o)) && nr.push(o));
      else {
        (st.deps ??= []).push(o);
        var c = o.reactions;
        c === null ? o.reactions = [st] : c.includes(st) || c.push(st);
      }
    }
  } else if (i && /** @type {Derived} */
  o.deps === null && /** @type {Derived} */
  o.effects === null) {
    var v = (
      /** @type {Derived} */
      o
    ), w = v.parent;
    w !== null && (w.f & Wr) === 0 && (v.f ^= Wr);
  }
  if (Qe) {
    if (Ue.has(o))
      return Ue.get(o);
    if (i) {
      v = /** @type {Derived} */
      o;
      var p = v.v;
      return ((v.f & Yt) === 0 && v.reactions !== null || eh(v)) && (p = Bu(v)), Ue.set(v, p), p;
    }
  } else if (i) {
    if (v = /** @type {Derived} */
    o, xn?.has(v))
      return xn.get(v);
    Ro(v) && Uf(v);
  }
  if ((o.f & Fe) !== 0)
    throw o.v;
  return o.v;
}
function eh(o) {
  if (o.v === Bt) return !0;
  if (o.deps === null) return !1;
  for (const e of o.deps)
    if (Ue.has(e) || (e.f & Rr) !== 0 && eh(
      /** @type {Derived} */
      e
    ))
      return !0;
  return !1;
}
function Co(o) {
  var e = Qr;
  try {
    return Qr = !0, o();
  } finally {
    Qr = e;
  }
}
const Qy = -7169;
function hr(o, e) {
  o.f = o.f & Qy | e;
}
function Jy(o) {
  if (!(typeof o != "object" || !o || o instanceof EventTarget)) {
    if (Be in o)
      Ru(o);
    else if (!Array.isArray(o))
      for (let e in o) {
        const i = o[e];
        typeof i == "object" && i && Be in i && Ru(i);
      }
  }
}
function Ru(o, e = /* @__PURE__ */ new Set()) {
  if (typeof o == "object" && o !== null && // We don't want to traverse DOM elements
  !(o instanceof EventTarget) && !e.has(o)) {
    e.add(o), o instanceof Date && o.getTime();
    for (let u in o)
      try {
        Ru(o[u], e);
      } catch {
      }
    const i = yo(o);
    if (i !== Object.prototype && i !== Array.prototype && i !== Map.prototype && i !== Set.prototype && i !== Date.prototype) {
      const u = Cf(i);
      for (let s in u) {
        const c = u[s].get;
        if (c)
          try {
            c.call(o);
          } catch {
          }
      }
    }
  }
}
function tb(o) {
  lt === null && st === null && Ry(), st !== null && (st.f & Wr) !== 0 && lt === null && xy(), Qe && _y();
}
function rb(o, e) {
  var i = e.last;
  i === null ? e.last = e.first = o : (i.next = o, o.prev = i, e.last = o);
}
function ge(o, e, i, u = !0) {
  var s = lt;
  s !== null && (s.f & Ur) !== 0 && (o |= Ur);
  var c = {
    ctx: At,
    deps: null,
    nodes_start: null,
    nodes_end: null,
    f: o | Lr,
    first: null,
    fn: e,
    last: null,
    next: null,
    parent: s,
    b: s && s.b,
    prev: null,
    teardown: null,
    transitions: null,
    wv: 0,
    ac: null
  };
  if (i)
    try {
      Qn(c), c.f |= Ou;
    } catch (p) {
      throw te(c), p;
    }
  else e !== null && Ve(c);
  var v = i && c.deps === null && c.first === null && c.nodes_start === null && c.teardown === null && (c.f & Hu) === 0;
  if (!v && u && (s !== null && rb(c, s), st !== null && (st.f & Rr) !== 0 && (o & Ye) === 0)) {
    var w = (
      /** @type {Derived} */
      st
    );
    (w.effects ??= []).push(c);
  }
  return c;
}
function eb(o) {
  const e = ge(Au, null, !1);
  return hr(e, Yt), e.teardown = o, e;
}
function Pt(o) {
  tb();
  var e = (
    /** @type {Effect} */
    lt.f
  ), i = !st && (e & de) !== 0 && (e & Ou) === 0;
  if (i) {
    var u = (
      /** @type {ComponentContext} */
      At
    );
    (u.e ??= []).push(o);
  } else
    return nh(o);
}
function nh(o) {
  return ge(ju | _f, o, !1);
}
function nb(o) {
  Rn.ensure();
  const e = ge(Ye, o, !0);
  return (i = {}) => new Promise((u) => {
    i.outro ? So(e, () => {
      te(e), u(void 0);
    }) : (te(e), u(void 0));
  });
}
function ci(o) {
  return ge(ju, o, !1);
}
function ib(o) {
  return ge(Mu | Hu, o, !0);
}
function ih(o, e = 0) {
  return ge(Au | e, o, !0);
}
function Lt(o, e = [], i = []) {
  Xy(e, i, (u) => {
    ge(Au, () => o(...u.map(d)), !0);
  });
}
function ko(o, e = 0) {
  var i = ge(ui | e, o, !0);
  return i;
}
function je(o, e = !0) {
  return ge(de, o, !0, e);
}
function oh(o) {
  var e = o.teardown;
  if (e !== null) {
    const i = Qe, u = st;
    Dc(!0), Jr(null);
    try {
      e.call(null);
    } finally {
      Dc(i), Jr(u);
    }
  }
}
function lh(o, e = !1) {
  var i = o.first;
  for (o.first = o.last = null; i !== null; ) {
    i.ac?.abort(Du);
    var u = i.next;
    (i.f & Ye) !== 0 ? i.parent = null : te(i, e), i = u;
  }
}
function ob(o) {
  for (var e = o.first; e !== null; ) {
    var i = e.next;
    (e.f & de) === 0 && te(e), e = i;
  }
}
function te(o, e = !0) {
  var i = !1;
  (e || (o.f & fy) !== 0) && o.nodes_start !== null && o.nodes_end !== null && (lb(
    o.nodes_start,
    /** @type {TemplateNode} */
    o.nodes_end
  ), i = !0), lh(o, e && !i), go(o, 0), hr(o, Ze);
  var u = o.transitions;
  if (u !== null)
    for (const c of u)
      c.stop();
  oh(o);
  var s = o.parent;
  s !== null && s.first !== null && uh(o), o.next = o.prev = o.teardown = o.ctx = o.deps = o.fn = o.nodes_start = o.nodes_end = o.ac = null;
}
function lb(o, e) {
  for (; o !== null; ) {
    var i = o === e ? null : (
      /** @type {TemplateNode} */
      /* @__PURE__ */ He(o)
    );
    o.remove(), o = i;
  }
}
function uh(o) {
  var e = o.parent, i = o.prev, u = o.next;
  i !== null && (i.next = u), u !== null && (u.prev = i), e !== null && (e.first === o && (e.first = u), e.last === o && (e.last = i));
}
function So(o, e) {
  var i = [];
  Uu(o, i, !0), ah(i, () => {
    te(o), e && e();
  });
}
function ah(o, e) {
  var i = o.length;
  if (i > 0) {
    var u = () => --i || e();
    for (var s of o)
      s.out(u);
  } else
    e();
}
function Uu(o, e, i) {
  if ((o.f & Ur) === 0) {
    if (o.f ^= Ur, o.transitions !== null)
      for (const v of o.transitions)
        (v.is_global || i) && e.push(v);
    for (var u = o.first; u !== null; ) {
      var s = u.next, c = (u.f & mo) !== 0 || (u.f & de) !== 0;
      Uu(u, e, c ? i : !1), u = s;
    }
  }
}
function Xu(o) {
  sh(o, !0);
}
function sh(o, e) {
  if ((o.f & Ur) !== 0) {
    o.f ^= Ur, (o.f & Yt) === 0 && (hr(o, Lr), Ve(o));
    for (var i = o.first; i !== null; ) {
      var u = i.next, s = (i.f & mo) !== 0 || (i.f & de) !== 0;
      sh(i, s ? e : !1), i = u;
    }
    if (o.transitions !== null)
      for (const c of o.transitions)
        (c.is_global || e) && c.in();
  }
}
let Wc = !1;
function ub() {
  Wc || (Wc = !0, document.addEventListener(
    "reset",
    (o) => {
      Promise.resolve().then(() => {
        if (!o.defaultPrevented)
          for (
            const e of
            /**@type {HTMLFormElement} */
            o.target.elements
          )
            e.__on_r?.();
      });
    },
    // In the capture phase to guarantee we get noticed of it (no possiblity of stopPropagation)
    { capture: !0 }
  ));
}
function ab(o) {
  var e = st, i = lt;
  Jr(null), Ee(null);
  try {
    return o();
  } finally {
    Jr(e), Ee(i);
  }
}
const ch = /* @__PURE__ */ new Set(), Cu = /* @__PURE__ */ new Set();
function sb(o, e, i, u = {}) {
  function s(c) {
    if (u.capture || Zn.call(e, c), !c.cancelBubble)
      return ab(() => i?.call(this, c));
  }
  return o.startsWith("pointer") || o.startsWith("touch") || o === "wheel" ? Fu(() => {
    e.addEventListener(o, s, u);
  }) : e.addEventListener(o, s, u), s;
}
function li(o, e, i, u, s) {
  var c = { capture: u, passive: s }, v = sb(o, e, i, c);
  (e === document.body || // @ts-ignore
  e === window || // @ts-ignore
  e === document || // Firefox has quirky behavior, it can happen that we still get "canplay" events when the element is already removed
  e instanceof HTMLMediaElement) && eb(() => {
    e.removeEventListener(o, v, c);
  });
}
function pe(o) {
  for (var e = 0; e < o.length; e++)
    ch.add(o[e]);
  for (var i of Cu)
    i(o);
}
let Lc = null;
function Zn(o) {
  var e = this, i = (
    /** @type {Node} */
    e.ownerDocument
  ), u = o.type, s = o.composedPath?.() || [], c = (
    /** @type {null | Element} */
    s[0] || o.target
  );
  Lc = o;
  var v = 0, w = Lc === o && o.__root;
  if (w) {
    var p = s.indexOf(w);
    if (p !== -1 && (e === document || e === /** @type {any} */
    window)) {
      o.__root = e;
      return;
    }
    var y = s.indexOf(e);
    if (y === -1)
      return;
    p <= y && (v = p);
  }
  if (c = /** @type {Element} */
  s[v] || o.target, c !== e) {
    fo(o, "currentTarget", {
      configurable: !0,
      get() {
        return c || i;
      }
    });
    var x = st, S = lt;
    Jr(null), Ee(null);
    try {
      for (var z, E = []; c !== null; ) {
        var k = c.assignedSlot || c.parentNode || /** @type {any} */
        c.host || null;
        try {
          var D = c["__" + u];
          if (D != null && (!/** @type {any} */
          c.disabled || // DOM could've been updated already by the time this is reached, so we check this as well
          // -> the target could not have been disabled because it emits the event in the first place
          o.target === c))
            if (wo(D)) {
              var [H, ...L] = D;
              H.apply(c, [o, ...L]);
            } else
              D.call(c, o);
        } catch (I) {
          z ? E.push(I) : z = I;
        }
        if (o.cancelBubble || k === e || k === null)
          break;
        c = k;
      }
      if (z) {
        for (let I of E)
          queueMicrotask(() => {
            throw I;
          });
        throw z;
      }
    } finally {
      o.__root = e, delete o.currentTarget, Jr(x), Ee(S);
    }
  }
}
function cb(o) {
  var e = document.createElement("template");
  return e.innerHTML = o.replaceAll("<!>", "<!---->"), e.content;
}
function _n(o, e) {
  var i = (
    /** @type {Effect} */
    lt
  );
  i.nodes_start === null && (i.nodes_start = o, i.nodes_end = e);
}
// @__NO_SIDE_EFFECTS__
function dt(o, e) {
  var i = (e & Hy) !== 0, u = (e & My) !== 0, s, c = !o.startsWith("<!>");
  return () => {
    if (vt)
      return _n(xt, null), xt;
    s === void 0 && (s = cb(c ? o : "<!>" + o), i || (s = /** @type {Node} */
    /* @__PURE__ */ Ke(s)));
    var v = (
      /** @type {TemplateNode} */
      u || Df ? document.importNode(s, !0) : s.cloneNode(!0)
    );
    if (i) {
      var w = (
        /** @type {TemplateNode} */
        /* @__PURE__ */ Ke(v)
      ), p = (
        /** @type {TemplateNode} */
        v.lastChild
      );
      _n(w, p);
    } else
      _n(v, v);
    return v;
  };
}
function mn() {
  if (vt)
    return _n(xt, null), xt;
  var o = document.createDocumentFragment(), e = document.createComment(""), i = Pe();
  return o.append(e, i), _n(e, i), o;
}
function nt(o, e) {
  if (vt) {
    lt.nodes_end = xt, si();
    return;
  }
  o !== null && o.before(
    /** @type {Node} */
    e
  );
}
const fb = ["touchstart", "touchmove"];
function hb(o) {
  return fb.includes(o);
}
function re(o, e) {
  var i = e == null ? "" : typeof e == "object" ? e + "" : e;
  i !== (o.__t ??= o.nodeValue) && (o.__t = i, o.nodeValue = i + "");
}
function fh(o, e) {
  return hh(o, e);
}
function vb(o, e) {
  _u(), e.intro = e.intro ?? !1;
  const i = e.target, u = vt, s = xt;
  try {
    for (var c = (
      /** @type {TemplateNode} */
      /* @__PURE__ */ Ke(i)
    ); c && (c.nodeType !== ti || /** @type {Comment} */
    c.data !== Af); )
      c = /** @type {TemplateNode} */
      /* @__PURE__ */ He(c);
    if (!c)
      throw yn;
    he(!0), Xr(
      /** @type {Comment} */
      c
    ), si();
    const v = hh(o, { ...e, anchor: c });
    if (xt === null || xt.nodeType !== ti || /** @type {Comment} */
    xt.data !== $u)
      throw bo(), yn;
    return he(!1), /**  @type {Exports} */
    v;
  } catch (v) {
    if (v === yn)
      return e.recover === !1 && ky(), _u(), Lf(i), he(!1), fh(o, e);
    throw v;
  } finally {
    he(u), Xr(s);
  }
}
const pn = /* @__PURE__ */ new Map();
function hh(o, { target: e, anchor: i, props: u = {}, events: s, context: c, intro: v = !0 }) {
  _u();
  var w = /* @__PURE__ */ new Set(), p = (S) => {
    for (var z = 0; z < S.length; z++) {
      var E = S[z];
      if (!w.has(E)) {
        w.add(E);
        var k = hb(E);
        e.addEventListener(E, Zn, { passive: k });
        var D = pn.get(E);
        D === void 0 ? (document.addEventListener(E, Zn, { passive: k }), pn.set(E, 1)) : pn.set(E, D + 1);
      }
    }
  };
  p(Iu(ch)), Cu.add(p);
  var y = void 0, x = nb(() => {
    var S = i ?? e.appendChild(Pe());
    return je(() => {
      if (c) {
        Dt({});
        var z = (
          /** @type {ComponentContext} */
          At
        );
        z.c = c;
      }
      s && (u.$$events = s), vt && _n(
        /** @type {TemplateNode} */
        S,
        null
      ), y = o(S, u) || {}, vt && (lt.nodes_end = xt), c && It();
    }), () => {
      for (var z of w) {
        e.removeEventListener(z, Zn);
        var E = (
          /** @type {number} */
          pn.get(z)
        );
        --E === 0 ? (document.removeEventListener(z, Zn), pn.delete(z)) : pn.set(z, E);
      }
      Cu.delete(p), S !== i && S.parentNode?.removeChild(S);
    };
  });
  return ku.set(y, x), y;
}
let ku = /* @__PURE__ */ new WeakMap();
function db(o, e) {
  const i = ku.get(o);
  return i ? (ku.delete(o), i(e)) : Promise.resolve();
}
function gb(o) {
  return new pb(o);
}
class pb {
  /** @type {any} */
  #t;
  /** @type {Record<string, any>} */
  #r;
  /**
   * @param {ComponentConstructorOptions & {
   *  component: any;
   * }} options
   */
  constructor(e) {
    var i = /* @__PURE__ */ new Map(), u = (c, v) => {
      var w = /* @__PURE__ */ Vf(v, !1, !1);
      return i.set(c, w), w;
    };
    const s = new Proxy(
      { ...e.props || {}, $$events: {} },
      {
        get(c, v) {
          return d(i.get(v) ?? u(v, Reflect.get(c, v)));
        },
        has(c, v) {
          return v === xf ? !0 : (d(i.get(v) ?? u(v, Reflect.get(c, v))), Reflect.has(c, v));
        },
        set(c, v, w) {
          return A(i.get(v) ?? u(v, w), w), Reflect.set(c, v, w);
        }
      }
    );
    this.#r = (e.hydrate ? vb : fh)(e.component, {
      target: e.target,
      anchor: e.anchor,
      props: s,
      context: e.context,
      intro: e.intro ?? !1,
      recover: e.recover
    }), (!e?.props?.$$host || e.sync === !1) && Gy(), this.#t = s.$$events;
    for (const c of Object.keys(this.#r))
      c === "$set" || c === "$destroy" || c === "$on" || fo(this, c, {
        get() {
          return this.#r[c];
        },
        /** @param {any} value */
        set(v) {
          this.#r[c] = v;
        },
        enumerable: !0
      });
    this.#r.$set = /** @param {Record<string, any>} next */
    (c) => {
      Object.assign(s, c);
    }, this.#r.$destroy = () => {
      db(this.#r);
    };
  }
  /** @param {Record<string, any>} props */
  $set(e) {
    this.#r.$set(e);
  }
  /**
   * @param {string} event
   * @param {(...args: any[]) => any} callback
   * @returns {any}
   */
  $on(e, i) {
    this.#t[e] = this.#t[e] || [];
    const u = (...s) => i.call(this, ...s);
    return this.#t[e].push(u), () => {
      this.#t[e] = this.#t[e].filter(
        /** @param {any} fn */
        (s) => s !== u
      );
    };
  }
  $destroy() {
    this.#r.$destroy();
  }
}
const mb = "5";
typeof window < "u" && ((window.__svelte ??= {}).v ??= /* @__PURE__ */ new Set()).add(mb);
function Ku(o, e, ...i) {
  var u = o, s = py, c;
  ko(() => {
    s !== (s = e()) && (c && (te(c), c = null), c = je(() => (
      /** @type {SnippetFn} */
      s(u, ...i)
    )));
  }, mo), vt && (u = xt);
}
function kn(o) {
  At === null && Ef(), ai && At.l !== null ? wb(At).m.push(o) : Pt(() => {
    const e = Co(o);
    if (typeof e == "function") return (
      /** @type {() => void} */
      e
    );
  });
}
function wb(o) {
  var e = (
    /** @type {ComponentContextLegacy} */
    o.l
  );
  return e.u ??= { a: [], b: [], m: [] };
}
function xr(o, e, i = !1) {
  vt && si();
  var u = o, s = null, c = null, v = Bt, w = i ? mo : 0, p = !1;
  const y = (z, E = !0) => {
    p = !0, S(E, z);
  };
  function x() {
    var z = v ? s : c, E = v ? c : s;
    z && Xu(z), E && So(E, () => {
      v ? c = null : s = null;
    });
  }
  const S = (z, E) => {
    if (v === (v = z)) return;
    let k = !1;
    if (vt) {
      const L = Mf(u) === Nu;
      !!v === L && (u = yu(), Xr(u), he(!1), k = !0);
    }
    var D = Tf(), H = u;
    v ? s ??= E && je(() => E(H)) : c ??= E && je(() => E(H)), D || x(), k && he(!0);
  };
  ko(() => {
    p = !1, e(y), p || S(null, null);
  }, w), vt && (u = xt);
}
function yb(o, e, i) {
  vt && si();
  var u = o, s = Bt, c, v, w = null, p = Cn() ? wy : Wu;
  function y() {
    c && So(c), w !== null && (w.lastChild.remove(), u.before(w), w = null), c = v;
  }
  ko(() => {
    if (p(s, s = e())) {
      var x = u, S = Tf();
      S && (w = document.createDocumentFragment(), w.append(x = Pe())), v = je(() => i(x)), S ? Wt.add_callback(y) : y();
    }
  }), vt && (u = xt);
}
function bb(o, e) {
  return e;
}
function _b(o, e, i) {
  for (var u = o.items, s = [], c = e.length, v = 0; v < c; v++)
    Uu(e[v].e, s, !0);
  var w = c > 0 && s.length === 0 && i !== null;
  if (w) {
    var p = (
      /** @type {Element} */
      /** @type {Element} */
      i.parentNode
    );
    Lf(p), p.append(
      /** @type {Element} */
      i
    ), u.clear(), Zr(o, e[0].prev, e[c - 1].next);
  }
  ah(s, () => {
    for (var y = 0; y < c; y++) {
      var x = e[y];
      w || (u.delete(x.k), Zr(o, x.prev, x.next)), te(x.e, !w);
    }
  });
}
function Jn(o, e, i, u, s, c = null) {
  var v = o, w = { flags: e, items: /* @__PURE__ */ new Map(), first: null }, p = (e & jf) !== 0;
  if (p) {
    var y = (
      /** @type {Element} */
      o
    );
    v = vt ? Xr(
      /** @type {Comment | Text} */
      /* @__PURE__ */ Ke(y)
    ) : y.appendChild(Pe());
  }
  vt && si();
  var x = null, S = !1, z = /* @__PURE__ */ new Map(), E = /* @__PURE__ */ Ff(() => {
    var L = i();
    return wo(L) ? L : L == null ? [] : Iu(L);
  }), k, D;
  function H() {
    xb(
      D,
      k,
      w,
      z,
      v,
      s,
      e,
      u,
      i
    ), c !== null && (k.length === 0 ? x ? Xu(x) : x = je(() => c(v)) : x !== null && So(x, () => {
      x = null;
    }));
  }
  ko(() => {
    D ??= /** @type {Effect} */
    lt, k = d(E);
    var L = k.length;
    if (S && L === 0)
      return;
    S = L === 0;
    let I = !1;
    if (vt) {
      var U = Mf(v) === Nu;
      U !== (L === 0) && (v = yu(), Xr(v), he(!1), I = !0);
    }
    if (vt) {
      for (var q = null, N, B = 0; B < L; B++) {
        if (xt.nodeType === ti && /** @type {Comment} */
        xt.data === $u) {
          v = /** @type {Comment} */
          xt, I = !0, he(!1);
          break;
        }
        var T = k[B], ct = u(T, B);
        N = vh(
          xt,
          w,
          q,
          null,
          T,
          ct,
          B,
          s,
          e,
          i
        ), w.items.set(ct, N), q = N;
      }
      L > 0 && Xr(yu());
    }
    vt ? L === 0 && c && (x = je(() => c(v))) : H(), I && he(!0), d(E);
  }), vt && (v = xt);
}
function xb(o, e, i, u, s, c, v, w, p) {
  var y = (v & Ay) !== 0, x = (v & (Lu | Tu)) !== 0, S = e.length, z = i.items, E = i.first, k = E, D, H = null, L, I = [], U = [], q, N, B, T;
  if (y)
    for (T = 0; T < S; T += 1)
      q = e[T], N = w(q, T), B = z.get(N), B !== void 0 && (B.a?.measure(), (L ??= /* @__PURE__ */ new Set()).add(B));
  for (T = 0; T < S; T += 1) {
    if (q = e[T], N = w(q, T), B = z.get(N), B === void 0) {
      var ct = u.get(N);
      if (ct !== void 0) {
        u.delete(N), z.set(N, ct);
        var it = H ? H.next : k;
        Zr(i, H, ct), Zr(i, ct, it), Zl(ct, it, s), H = ct;
      } else {
        var kt = k ? (
          /** @type {TemplateNode} */
          k.e.nodes_start
        ) : s;
        H = vh(
          kt,
          i,
          H,
          H === null ? i.first : H.next,
          q,
          N,
          T,
          c,
          v,
          p
        );
      }
      z.set(N, H), I = [], U = [], k = H.next;
      continue;
    }
    if (x && Rb(B, q, T, v), (B.e.f & Ur) !== 0 && (Xu(B.e), y && (B.a?.unfix(), (L ??= /* @__PURE__ */ new Set()).delete(B))), B !== k) {
      if (D !== void 0 && D.has(B)) {
        if (I.length < U.length) {
          var Tt = U[0], Et;
          H = Tt.prev;
          var at = I[0], rt = I[I.length - 1];
          for (Et = 0; Et < I.length; Et += 1)
            Zl(I[Et], Tt, s);
          for (Et = 0; Et < U.length; Et += 1)
            D.delete(U[Et]);
          Zr(i, at.prev, rt.next), Zr(i, H, at), Zr(i, rt, Tt), k = Tt, H = rt, T -= 1, I = [], U = [];
        } else
          D.delete(B), Zl(B, k, s), Zr(i, B.prev, B.next), Zr(i, B, H === null ? i.first : H.next), Zr(i, H, B), H = B;
        continue;
      }
      for (I = [], U = []; k !== null && k.k !== N; )
        (k.e.f & Ur) === 0 && (D ??= /* @__PURE__ */ new Set()).add(k), U.push(k), k = k.next;
      if (k === null)
        continue;
      B = k;
    }
    I.push(B), H = B, k = B.next;
  }
  if (k !== null || D !== void 0) {
    for (var mt = D === void 0 ? [] : Iu(D); k !== null; )
      (k.e.f & Ur) === 0 && mt.push(k), k = k.next;
    var Qt = mt.length;
    if (Qt > 0) {
      var qt = (v & jf) !== 0 && S === 0 ? s : null;
      if (y) {
        for (T = 0; T < Qt; T += 1)
          mt[T].a?.measure();
        for (T = 0; T < Qt; T += 1)
          mt[T].a?.fix();
      }
      _b(i, mt, qt);
    }
  }
  y && Fu(() => {
    if (L !== void 0)
      for (B of L)
        B.a?.apply();
  }), o.first = i.first && i.first.e, o.last = H && H.e;
  for (var ir of u.values())
    te(ir.e);
  u.clear();
}
function Rb(o, e, i, u) {
  (u & Lu) !== 0 && ii(o.v, e), (u & Tu) !== 0 ? ii(
    /** @type {Value<number>} */
    o.i,
    i
  ) : o.i = i;
}
function vh(o, e, i, u, s, c, v, w, p, y, x) {
  var S = (p & Lu) !== 0, z = (p & Oy) === 0, E = S ? z ? /* @__PURE__ */ Vf(s, !1, !1) : ni(s) : s, k = (p & Tu) === 0 ? v : ni(v), D = {
    i: k,
    v: E,
    k: c,
    a: null,
    // @ts-expect-error
    e: null,
    prev: i,
    next: u
  };
  try {
    if (o === null) {
      var H = document.createDocumentFragment();
      H.append(o = Pe());
    }
    return D.e = je(() => w(
      /** @type {Node} */
      o,
      E,
      k,
      y
    ), vt), D.e.prev = i && i.e, D.e.next = u && u.e, i === null ? x || (e.first = D) : (i.next = D, i.e.next = D.e), u !== null && (u.prev = D, u.e.prev = D.e), D;
  } finally {
  }
}
function Zl(o, e, i) {
  for (var u = o.next ? (
    /** @type {TemplateNode} */
    o.next.e.nodes_start
  ) : i, s = e ? (
    /** @type {TemplateNode} */
    e.e.nodes_start
  ) : i, c = (
    /** @type {TemplateNode} */
    o.e.nodes_start
  ); c !== null && c !== u; ) {
    var v = (
      /** @type {TemplateNode} */
      /* @__PURE__ */ He(c)
    );
    s.before(c), c = v;
  }
}
function Zr(o, e, i) {
  e === null ? o.first = i : (e.next = i, e.e.next = i && i.e), i !== null && (i.prev = e, i.e.prev = e && e.e);
}
function Ot(o, e) {
  ci(() => {
    var i = o.getRootNode(), u = (
      /** @type {ShadowRoot} */
      i.host ? (
        /** @type {ShadowRoot} */
        i
      ) : (
        /** @type {Document} */
        i.head ?? /** @type {Document} */
        i.ownerDocument.head
      )
    );
    if (!u.querySelector("#" + e.hash)) {
      const s = document.createElement("style");
      s.id = e.hash, s.textContent = e.code, u.appendChild(s);
    }
  });
}
function Gu(o, e, i) {
  ci(() => {
    var u = Co(() => e(o, i?.()) || {});
    if (i && u?.update) {
      var s = !1, c = (
        /** @type {any} */
        {}
      );
      ih(() => {
        var v = i();
        Jy(v), s && Wu(c, v) && (c = v, u.update(v));
      }), s = !0;
    }
    if (u?.destroy)
      return () => (
        /** @type {Function} */
        u.destroy()
      );
  });
}
function Cb(o, e, i) {
  var u = o == null ? "" : "" + o;
  return e && (u = u ? u + " " + e : e), u === "" ? null : u;
}
function Tc(o, e = !1) {
  var i = e ? " !important;" : ";", u = "";
  for (var s in o) {
    var c = o[s];
    c != null && c !== "" && (u += " " + s + ": " + c + i);
  }
  return u;
}
function kb(o, e) {
  if (e) {
    var i = "", u, s;
    return Array.isArray(e) ? (u = e[0], s = e[1]) : u = e, u && (i += Tc(u)), s && (i += Tc(s, !0)), i = i.trim(), i === "" ? null : i;
  }
  return String(o);
}
function Ae(o, e, i, u, s, c) {
  var v = o.__className;
  if (vt || v !== i || v === void 0) {
    var w = Cb(i, u);
    (!vt || w !== o.getAttribute("class")) && (w == null ? o.removeAttribute("class") : o.className = w), o.__className = i;
  }
  return c;
}
function Ql(o, e = {}, i, u) {
  for (var s in i) {
    var c = i[s];
    e[s] !== c && (i[s] == null ? o.style.removeProperty(s) : o.style.setProperty(s, c, u));
  }
}
function dr(o, e, i, u) {
  var s = o.__style;
  if (vt || s !== e) {
    var c = kb(e, u);
    (!vt || c !== o.getAttribute("style")) && (c == null ? o.removeAttribute("style") : o.style.cssText = c), o.__style = e;
  } else u && (Array.isArray(u) ? (Ql(o, i?.[0], u[0]), Ql(o, i?.[1], u[1], "important")) : Ql(o, i, u));
  return u;
}
const Sb = Symbol("is custom element"), zb = Symbol("is html");
function Pb(o) {
  if (vt) {
    var e = !1, i = () => {
      if (!e) {
        if (e = !0, o.hasAttribute("value")) {
          var u = o.value;
          po(o, "value", null), o.value = u;
        }
        if (o.hasAttribute("checked")) {
          var s = o.checked;
          po(o, "checked", null), o.checked = s;
        }
      }
    };
    o.__on_r = i, $y(i), ub();
  }
}
function Eb(o, e) {
  var i = dh(o);
  i.checked !== (i.checked = // treat null and undefined the same for the initial value
  e ?? void 0) && (o.checked = e);
}
function po(o, e, i, u) {
  var s = dh(o);
  vt && (s[e] = o.getAttribute(e), e === "src" || e === "srcset" || e === "href" && o.nodeName === "LINK") || s[e] !== (s[e] = i) && (e === "loading" && (o[hy] = i), i == null ? o.removeAttribute(e) : typeof i != "string" && jb(o).includes(e) ? o[e] = i : o.setAttribute(e, i));
}
function dh(o) {
  return (
    /** @type {Record<string | symbol, unknown>} **/
    // @ts-expect-error
    o.__attributes ??= {
      [Sb]: o.nodeName.includes("-"),
      [zb]: o.namespaceURI === Dy
    }
  );
}
var Nc = /* @__PURE__ */ new Map();
function jb(o) {
  var e = Nc.get(o.nodeName);
  if (e) return e;
  Nc.set(o.nodeName, e = []);
  for (var i, u = o, s = Element.prototype; s !== u; ) {
    i = Cf(u);
    for (var c in i)
      i[c].set && e.push(c);
    u = yo(u);
  }
  return e;
}
class Vu {
  /** */
  #t = /* @__PURE__ */ new WeakMap();
  /** @type {ResizeObserver | undefined} */
  #r;
  /** @type {ResizeObserverOptions} */
  #e;
  /** @static */
  static entries = /* @__PURE__ */ new WeakMap();
  /** @param {ResizeObserverOptions} options */
  constructor(e) {
    this.#e = e;
  }
  /**
   * @param {Element} element
   * @param {(entry: ResizeObserverEntry) => any} listener
   */
  observe(e, i) {
    var u = this.#t.get(e) || /* @__PURE__ */ new Set();
    return u.add(i), this.#t.set(e, u), this.#n().observe(e, this.#e), () => {
      var s = this.#t.get(e);
      s.delete(i), s.size === 0 && (this.#t.delete(e), this.#r.unobserve(e));
    };
  }
  #n() {
    return this.#r ?? (this.#r = new ResizeObserver(
      /** @param {any} entries */
      (e) => {
        for (var i of e) {
          Vu.entries.set(i.target, i);
          for (var u of this.#t.get(i.target) || [])
            u(i);
        }
      }
    ));
  }
}
var Ab = /* @__PURE__ */ new Vu({
  box: "border-box"
});
function Kr(o, e, i) {
  var u = Ab.observe(o, () => i(o[e]));
  ci(() => (Co(() => i(o[e])), u));
}
function $c(o, e) {
  return o === e || o?.[Be] === e;
}
function vr(o = {}, e, i, u) {
  return ci(() => {
    var s, c;
    return ih(() => {
      s = c, c = [], Co(() => {
        o !== i(...c) && (e(o, ...c), s && $c(i(...s), o) && e(null, ...s));
      });
    }), () => {
      Fu(() => {
        c && $c(i(...c), o) && e(null, ...c);
      });
    };
  }), o;
}
let io = !1;
function Ob(o) {
  var e = io;
  try {
    return io = !1, [o(), io];
  } finally {
    io = e;
  }
}
function fi(o, e, i, u) {
  var s = (
    /** @type {V} */
    u
  ), c = !0, v = () => (c && (c = !1, s = /** @type {V} */
  u), s), w;
  {
    var p = Be in o || xf in o;
    w = wn(o, e)?.set ?? (p && e in o ? (H) => o[e] = H : void 0);
  }
  var y, x = !1;
  [y, x] = Ob(() => (
    /** @type {V} */
    o[e]
  ));
  var S;
  if (S = () => {
    var H = (
      /** @type {V} */
      o[e]
    );
    return H === void 0 ? v() : (c = !0, H);
  }, w) {
    var z = o.$$legacy;
    return function(H, L) {
      return arguments.length > 0 ? ((!L || z || x) && w(L ? S() : H), H) : S();
    };
  }
  var E = !1, k = /* @__PURE__ */ _o(() => (E = !1, S()));
  d(k);
  var D = (
    /** @type {Effect} */
    lt
  );
  return function(H, L) {
    if (arguments.length > 0) {
      const I = L ? d(k) : Zt(H);
      return A(k, I), E = !0, s !== void 0 && (s = I), H;
    }
    return Qe && E || (D.f & Ze) !== 0 ? k.v : d(k);
  };
}
var ze = typeof globalThis < "u" ? globalThis : typeof window < "u" ? window : typeof global < "u" ? global : typeof self < "u" ? self : {};
function Yu(o) {
  return o && o.__esModule && Object.prototype.hasOwnProperty.call(o, "default") ? o.default : o;
}
var uo = { exports: {} };
/**
 * @license
 * Lodash <https://lodash.com/>
 * Copyright OpenJS Foundation and other contributors <https://openjsf.org/>
 * Released under MIT license <https://lodash.com/license>
 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
 * Copyright Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 */
var Hb = uo.exports, qc;
function Mb() {
  return qc || (qc = 1, function(o, e) {
    (function() {
      var i, u = "4.17.21", s = 200, c = "Unsupported core-js use. Try https://npms.io/search?q=ponyfill.", v = "Expected a function", w = "Invalid `variable` option passed into `_.template`", p = "__lodash_hash_undefined__", y = 500, x = "__lodash_placeholder__", S = 1, z = 2, E = 4, k = 1, D = 2, H = 1, L = 2, I = 4, U = 8, q = 16, N = 32, B = 64, T = 128, ct = 256, it = 512, kt = 30, Tt = "...", Et = 800, at = 16, rt = 1, mt = 2, Qt = 3, qt = 1 / 0, ir = 9007199254740991, Kt = 17976931348623157e292, Cr = NaN, Jt = 4294967295, zo = Jt - 1, Sn = Jt >>> 1, Po = [
        ["ary", T],
        ["bind", H],
        ["bindKey", L],
        ["curry", U],
        ["curryRight", q],
        ["flip", it],
        ["partial", N],
        ["partialRight", B],
        ["rearg", ct]
      ], Je = "[object Arguments]", hi = "[object Array]", yh = "[object AsyncFunction]", zn = "[object Boolean]", Pn = "[object Date]", bh = "[object DOMException]", vi = "[object Error]", di = "[object Function]", Qu = "[object GeneratorFunction]", Tr = "[object Map]", En = "[object Number]", _h = "[object Null]", ee = "[object Object]", Ju = "[object Promise]", xh = "[object Proxy]", jn = "[object RegExp]", Nr = "[object Set]", An = "[object String]", gi = "[object Symbol]", Rh = "[object Undefined]", On = "[object WeakMap]", Ch = "[object WeakSet]", Hn = "[object ArrayBuffer]", tn = "[object DataView]", Eo = "[object Float32Array]", jo = "[object Float64Array]", Ao = "[object Int8Array]", Oo = "[object Int16Array]", Ho = "[object Int32Array]", Mo = "[object Uint8Array]", Do = "[object Uint8ClampedArray]", Io = "[object Uint16Array]", Wo = "[object Uint32Array]", kh = /\b__p \+= '';/g, Sh = /\b(__p \+=) '' \+/g, zh = /(__e\(.*?\)|\b__t\)) \+\n'';/g, ta = /&(?:amp|lt|gt|quot|#39);/g, ra = /[&<>"']/g, Ph = RegExp(ta.source), Eh = RegExp(ra.source), jh = /<%-([\s\S]+?)%>/g, Ah = /<%([\s\S]+?)%>/g, ea = /<%=([\s\S]+?)%>/g, Oh = /\.|\[(?:[^[\]]*|(["'])(?:(?!\1)[^\\]|\\.)*?\1)\]/, Hh = /^\w*$/, Mh = /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|$))/g, Lo = /[\\^$.*+?()[\]{}|]/g, Dh = RegExp(Lo.source), To = /^\s+/, Ih = /\s/, Wh = /\{(?:\n\/\* \[wrapped with .+\] \*\/)?\n?/, Lh = /\{\n\/\* \[wrapped with (.+)\] \*/, Th = /,? & /, Nh = /[^\x00-\x2f\x3a-\x40\x5b-\x60\x7b-\x7f]+/g, $h = /[()=,{}\[\]\/\s]/, qh = /\\(\\)?/g, Fh = /\$\{([^\\}]*(?:\\.[^\\}]*)*)\}/g, na = /\w*$/, Bh = /^[-+]0x[0-9a-f]+$/i, Uh = /^0b[01]+$/i, Xh = /^\[object .+?Constructor\]$/, Kh = /^0o[0-7]+$/i, Gh = /^(?:0|[1-9]\d*)$/, Vh = /[\xc0-\xd6\xd8-\xf6\xf8-\xff\u0100-\u017f]/g, pi = /($^)/, Yh = /['\n\r\u2028\u2029\\]/g, mi = "\\ud800-\\udfff", Zh = "\\u0300-\\u036f", Qh = "\\ufe20-\\ufe2f", Jh = "\\u20d0-\\u20ff", ia = Zh + Qh + Jh, oa = "\\u2700-\\u27bf", la = "a-z\\xdf-\\xf6\\xf8-\\xff", tv = "\\xac\\xb1\\xd7\\xf7", rv = "\\x00-\\x2f\\x3a-\\x40\\x5b-\\x60\\x7b-\\xbf", ev = "\\u2000-\\u206f", nv = " \\t\\x0b\\f\\xa0\\ufeff\\n\\r\\u2028\\u2029\\u1680\\u180e\\u2000\\u2001\\u2002\\u2003\\u2004\\u2005\\u2006\\u2007\\u2008\\u2009\\u200a\\u202f\\u205f\\u3000", ua = "A-Z\\xc0-\\xd6\\xd8-\\xde", aa = "\\ufe0e\\ufe0f", sa = tv + rv + ev + nv, No = "['’]", iv = "[" + mi + "]", ca = "[" + sa + "]", wi = "[" + ia + "]", fa = "\\d+", ov = "[" + oa + "]", ha = "[" + la + "]", va = "[^" + mi + sa + fa + oa + la + ua + "]", $o = "\\ud83c[\\udffb-\\udfff]", lv = "(?:" + wi + "|" + $o + ")", da = "[^" + mi + "]", qo = "(?:\\ud83c[\\udde6-\\uddff]){2}", Fo = "[\\ud800-\\udbff][\\udc00-\\udfff]", rn = "[" + ua + "]", ga = "\\u200d", pa = "(?:" + ha + "|" + va + ")", uv = "(?:" + rn + "|" + va + ")", ma = "(?:" + No + "(?:d|ll|m|re|s|t|ve))?", wa = "(?:" + No + "(?:D|LL|M|RE|S|T|VE))?", ya = lv + "?", ba = "[" + aa + "]?", av = "(?:" + ga + "(?:" + [da, qo, Fo].join("|") + ")" + ba + ya + ")*", sv = "\\d*(?:1st|2nd|3rd|(?![123])\\dth)(?=\\b|[A-Z_])", cv = "\\d*(?:1ST|2ND|3RD|(?![123])\\dTH)(?=\\b|[a-z_])", _a = ba + ya + av, fv = "(?:" + [ov, qo, Fo].join("|") + ")" + _a, hv = "(?:" + [da + wi + "?", wi, qo, Fo, iv].join("|") + ")", vv = RegExp(No, "g"), dv = RegExp(wi, "g"), Bo = RegExp($o + "(?=" + $o + ")|" + hv + _a, "g"), gv = RegExp([
        rn + "?" + ha + "+" + ma + "(?=" + [ca, rn, "$"].join("|") + ")",
        uv + "+" + wa + "(?=" + [ca, rn + pa, "$"].join("|") + ")",
        rn + "?" + pa + "+" + ma,
        rn + "+" + wa,
        cv,
        sv,
        fa,
        fv
      ].join("|"), "g"), pv = RegExp("[" + ga + mi + ia + aa + "]"), mv = /[a-z][A-Z]|[A-Z]{2}[a-z]|[0-9][a-zA-Z]|[a-zA-Z][0-9]|[^a-zA-Z0-9 ]/, wv = [
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
      ], yv = -1, Ct = {};
      Ct[Eo] = Ct[jo] = Ct[Ao] = Ct[Oo] = Ct[Ho] = Ct[Mo] = Ct[Do] = Ct[Io] = Ct[Wo] = !0, Ct[Je] = Ct[hi] = Ct[Hn] = Ct[zn] = Ct[tn] = Ct[Pn] = Ct[vi] = Ct[di] = Ct[Tr] = Ct[En] = Ct[ee] = Ct[jn] = Ct[Nr] = Ct[An] = Ct[On] = !1;
      var Rt = {};
      Rt[Je] = Rt[hi] = Rt[Hn] = Rt[tn] = Rt[zn] = Rt[Pn] = Rt[Eo] = Rt[jo] = Rt[Ao] = Rt[Oo] = Rt[Ho] = Rt[Tr] = Rt[En] = Rt[ee] = Rt[jn] = Rt[Nr] = Rt[An] = Rt[gi] = Rt[Mo] = Rt[Do] = Rt[Io] = Rt[Wo] = !0, Rt[vi] = Rt[di] = Rt[On] = !1;
      var bv = {
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
      }, _v = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      }, xv = {
        "&amp;": "&",
        "&lt;": "<",
        "&gt;": ">",
        "&quot;": '"',
        "&#39;": "'"
      }, Rv = {
        "\\": "\\",
        "'": "'",
        "\n": "n",
        "\r": "r",
        "\u2028": "u2028",
        "\u2029": "u2029"
      }, Cv = parseFloat, kv = parseInt, xa = typeof ze == "object" && ze && ze.Object === Object && ze, Sv = typeof self == "object" && self && self.Object === Object && self, Ut = xa || Sv || Function("return this")(), Uo = e && !e.nodeType && e, Me = Uo && !0 && o && !o.nodeType && o, Ra = Me && Me.exports === Uo, Xo = Ra && xa.process, kr = function() {
        try {
          var b = Me && Me.require && Me.require("util").types;
          return b || Xo && Xo.binding && Xo.binding("util");
        } catch {
        }
      }(), Ca = kr && kr.isArrayBuffer, ka = kr && kr.isDate, Sa = kr && kr.isMap, za = kr && kr.isRegExp, Pa = kr && kr.isSet, Ea = kr && kr.isTypedArray;
      function gr(b, C, R) {
        switch (R.length) {
          case 0:
            return b.call(C);
          case 1:
            return b.call(C, R[0]);
          case 2:
            return b.call(C, R[0], R[1]);
          case 3:
            return b.call(C, R[0], R[1], R[2]);
        }
        return b.apply(C, R);
      }
      function zv(b, C, R, $) {
        for (var Y = -1, ft = b == null ? 0 : b.length; ++Y < ft; ) {
          var Nt = b[Y];
          C($, Nt, R(Nt), b);
        }
        return $;
      }
      function Sr(b, C) {
        for (var R = -1, $ = b == null ? 0 : b.length; ++R < $ && C(b[R], R, b) !== !1; )
          ;
        return b;
      }
      function Pv(b, C) {
        for (var R = b == null ? 0 : b.length; R-- && C(b[R], R, b) !== !1; )
          ;
        return b;
      }
      function ja(b, C) {
        for (var R = -1, $ = b == null ? 0 : b.length; ++R < $; )
          if (!C(b[R], R, b))
            return !1;
        return !0;
      }
      function me(b, C) {
        for (var R = -1, $ = b == null ? 0 : b.length, Y = 0, ft = []; ++R < $; ) {
          var Nt = b[R];
          C(Nt, R, b) && (ft[Y++] = Nt);
        }
        return ft;
      }
      function yi(b, C) {
        var R = b == null ? 0 : b.length;
        return !!R && en(b, C, 0) > -1;
      }
      function Ko(b, C, R) {
        for (var $ = -1, Y = b == null ? 0 : b.length; ++$ < Y; )
          if (R(C, b[$]))
            return !0;
        return !1;
      }
      function St(b, C) {
        for (var R = -1, $ = b == null ? 0 : b.length, Y = Array($); ++R < $; )
          Y[R] = C(b[R], R, b);
        return Y;
      }
      function we(b, C) {
        for (var R = -1, $ = C.length, Y = b.length; ++R < $; )
          b[Y + R] = C[R];
        return b;
      }
      function Go(b, C, R, $) {
        var Y = -1, ft = b == null ? 0 : b.length;
        for ($ && ft && (R = b[++Y]); ++Y < ft; )
          R = C(R, b[Y], Y, b);
        return R;
      }
      function Ev(b, C, R, $) {
        var Y = b == null ? 0 : b.length;
        for ($ && Y && (R = b[--Y]); Y--; )
          R = C(R, b[Y], Y, b);
        return R;
      }
      function Vo(b, C) {
        for (var R = -1, $ = b == null ? 0 : b.length; ++R < $; )
          if (C(b[R], R, b))
            return !0;
        return !1;
      }
      var jv = Yo("length");
      function Av(b) {
        return b.split("");
      }
      function Ov(b) {
        return b.match(Nh) || [];
      }
      function Aa(b, C, R) {
        var $;
        return R(b, function(Y, ft, Nt) {
          if (C(Y, ft, Nt))
            return $ = ft, !1;
        }), $;
      }
      function bi(b, C, R, $) {
        for (var Y = b.length, ft = R + ($ ? 1 : -1); $ ? ft-- : ++ft < Y; )
          if (C(b[ft], ft, b))
            return ft;
        return -1;
      }
      function en(b, C, R) {
        return C === C ? Bv(b, C, R) : bi(b, Oa, R);
      }
      function Hv(b, C, R, $) {
        for (var Y = R - 1, ft = b.length; ++Y < ft; )
          if ($(b[Y], C))
            return Y;
        return -1;
      }
      function Oa(b) {
        return b !== b;
      }
      function Ha(b, C) {
        var R = b == null ? 0 : b.length;
        return R ? Qo(b, C) / R : Cr;
      }
      function Yo(b) {
        return function(C) {
          return C == null ? i : C[b];
        };
      }
      function Zo(b) {
        return function(C) {
          return b == null ? i : b[C];
        };
      }
      function Ma(b, C, R, $, Y) {
        return Y(b, function(ft, Nt, _t) {
          R = $ ? ($ = !1, ft) : C(R, ft, Nt, _t);
        }), R;
      }
      function Mv(b, C) {
        var R = b.length;
        for (b.sort(C); R--; )
          b[R] = b[R].value;
        return b;
      }
      function Qo(b, C) {
        for (var R, $ = -1, Y = b.length; ++$ < Y; ) {
          var ft = C(b[$]);
          ft !== i && (R = R === i ? ft : R + ft);
        }
        return R;
      }
      function Jo(b, C) {
        for (var R = -1, $ = Array(b); ++R < b; )
          $[R] = C(R);
        return $;
      }
      function Dv(b, C) {
        return St(C, function(R) {
          return [R, b[R]];
        });
      }
      function Da(b) {
        return b && b.slice(0, Ta(b) + 1).replace(To, "");
      }
      function pr(b) {
        return function(C) {
          return b(C);
        };
      }
      function tl(b, C) {
        return St(C, function(R) {
          return b[R];
        });
      }
      function Mn(b, C) {
        return b.has(C);
      }
      function Ia(b, C) {
        for (var R = -1, $ = b.length; ++R < $ && en(C, b[R], 0) > -1; )
          ;
        return R;
      }
      function Wa(b, C) {
        for (var R = b.length; R-- && en(C, b[R], 0) > -1; )
          ;
        return R;
      }
      function Iv(b, C) {
        for (var R = b.length, $ = 0; R--; )
          b[R] === C && ++$;
        return $;
      }
      var Wv = Zo(bv), Lv = Zo(_v);
      function Tv(b) {
        return "\\" + Rv[b];
      }
      function Nv(b, C) {
        return b == null ? i : b[C];
      }
      function nn(b) {
        return pv.test(b);
      }
      function $v(b) {
        return mv.test(b);
      }
      function qv(b) {
        for (var C, R = []; !(C = b.next()).done; )
          R.push(C.value);
        return R;
      }
      function rl(b) {
        var C = -1, R = Array(b.size);
        return b.forEach(function($, Y) {
          R[++C] = [Y, $];
        }), R;
      }
      function La(b, C) {
        return function(R) {
          return b(C(R));
        };
      }
      function ye(b, C) {
        for (var R = -1, $ = b.length, Y = 0, ft = []; ++R < $; ) {
          var Nt = b[R];
          (Nt === C || Nt === x) && (b[R] = x, ft[Y++] = R);
        }
        return ft;
      }
      function _i(b) {
        var C = -1, R = Array(b.size);
        return b.forEach(function($) {
          R[++C] = $;
        }), R;
      }
      function Fv(b) {
        var C = -1, R = Array(b.size);
        return b.forEach(function($) {
          R[++C] = [$, $];
        }), R;
      }
      function Bv(b, C, R) {
        for (var $ = R - 1, Y = b.length; ++$ < Y; )
          if (b[$] === C)
            return $;
        return -1;
      }
      function Uv(b, C, R) {
        for (var $ = R + 1; $--; )
          if (b[$] === C)
            return $;
        return $;
      }
      function on(b) {
        return nn(b) ? Kv(b) : jv(b);
      }
      function $r(b) {
        return nn(b) ? Gv(b) : Av(b);
      }
      function Ta(b) {
        for (var C = b.length; C-- && Ih.test(b.charAt(C)); )
          ;
        return C;
      }
      var Xv = Zo(xv);
      function Kv(b) {
        for (var C = Bo.lastIndex = 0; Bo.test(b); )
          ++C;
        return C;
      }
      function Gv(b) {
        return b.match(Bo) || [];
      }
      function Vv(b) {
        return b.match(gv) || [];
      }
      var Yv = function b(C) {
        C = C == null ? Ut : ln.defaults(Ut.Object(), C, ln.pick(Ut, wv));
        var R = C.Array, $ = C.Date, Y = C.Error, ft = C.Function, Nt = C.Math, _t = C.Object, el = C.RegExp, Zv = C.String, zr = C.TypeError, xi = R.prototype, Qv = ft.prototype, un = _t.prototype, Ri = C["__core-js_shared__"], Ci = Qv.toString, wt = un.hasOwnProperty, Jv = 0, Na = function() {
          var t = /[^.]+$/.exec(Ri && Ri.keys && Ri.keys.IE_PROTO || "");
          return t ? "Symbol(src)_1." + t : "";
        }(), ki = un.toString, td = Ci.call(_t), rd = Ut._, ed = el(
          "^" + Ci.call(wt).replace(Lo, "\\$&").replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, "$1.*?") + "$"
        ), Si = Ra ? C.Buffer : i, be = C.Symbol, zi = C.Uint8Array, $a = Si ? Si.allocUnsafe : i, Pi = La(_t.getPrototypeOf, _t), qa = _t.create, Fa = un.propertyIsEnumerable, Ei = xi.splice, Ba = be ? be.isConcatSpreadable : i, Dn = be ? be.iterator : i, De = be ? be.toStringTag : i, ji = function() {
          try {
            var t = Ne(_t, "defineProperty");
            return t({}, "", {}), t;
          } catch {
          }
        }(), nd = C.clearTimeout !== Ut.clearTimeout && C.clearTimeout, id = $ && $.now !== Ut.Date.now && $.now, od = C.setTimeout !== Ut.setTimeout && C.setTimeout, Ai = Nt.ceil, Oi = Nt.floor, nl = _t.getOwnPropertySymbols, ld = Si ? Si.isBuffer : i, Ua = C.isFinite, ud = xi.join, ad = La(_t.keys, _t), $t = Nt.max, Gt = Nt.min, sd = $.now, cd = C.parseInt, Xa = Nt.random, fd = xi.reverse, il = Ne(C, "DataView"), In = Ne(C, "Map"), ol = Ne(C, "Promise"), an = Ne(C, "Set"), Wn = Ne(C, "WeakMap"), Ln = Ne(_t, "create"), Hi = Wn && new Wn(), sn = {}, hd = $e(il), vd = $e(In), dd = $e(ol), gd = $e(an), pd = $e(Wn), Mi = be ? be.prototype : i, Tn = Mi ? Mi.valueOf : i, Ka = Mi ? Mi.toString : i;
        function f(t) {
          if (jt(t) && !Z(t) && !(t instanceof ot)) {
            if (t instanceof Pr)
              return t;
            if (wt.call(t, "__wrapped__"))
              return Gs(t);
          }
          return new Pr(t);
        }
        var cn = /* @__PURE__ */ function() {
          function t() {
          }
          return function(r) {
            if (!zt(r))
              return {};
            if (qa)
              return qa(r);
            t.prototype = r;
            var n = new t();
            return t.prototype = i, n;
          };
        }();
        function Di() {
        }
        function Pr(t, r) {
          this.__wrapped__ = t, this.__actions__ = [], this.__chain__ = !!r, this.__index__ = 0, this.__values__ = i;
        }
        f.templateSettings = {
          /**
           * Used to detect `data` property values to be HTML-escaped.
           *
           * @memberOf _.templateSettings
           * @type {RegExp}
           */
          escape: jh,
          /**
           * Used to detect code to be evaluated.
           *
           * @memberOf _.templateSettings
           * @type {RegExp}
           */
          evaluate: Ah,
          /**
           * Used to detect `data` property values to inject.
           *
           * @memberOf _.templateSettings
           * @type {RegExp}
           */
          interpolate: ea,
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
            _: f
          }
        }, f.prototype = Di.prototype, f.prototype.constructor = f, Pr.prototype = cn(Di.prototype), Pr.prototype.constructor = Pr;
        function ot(t) {
          this.__wrapped__ = t, this.__actions__ = [], this.__dir__ = 1, this.__filtered__ = !1, this.__iteratees__ = [], this.__takeCount__ = Jt, this.__views__ = [];
        }
        function md() {
          var t = new ot(this.__wrapped__);
          return t.__actions__ = or(this.__actions__), t.__dir__ = this.__dir__, t.__filtered__ = this.__filtered__, t.__iteratees__ = or(this.__iteratees__), t.__takeCount__ = this.__takeCount__, t.__views__ = or(this.__views__), t;
        }
        function wd() {
          if (this.__filtered__) {
            var t = new ot(this);
            t.__dir__ = -1, t.__filtered__ = !0;
          } else
            t = this.clone(), t.__dir__ *= -1;
          return t;
        }
        function yd() {
          var t = this.__wrapped__.value(), r = this.__dir__, n = Z(t), l = r < 0, a = n ? t.length : 0, h = Ag(0, a, this.__views__), g = h.start, m = h.end, _ = m - g, P = l ? m : g - 1, j = this.__iteratees__, O = j.length, W = 0, X = Gt(_, this.__takeCount__);
          if (!n || !l && a == _ && X == _)
            return ms(t, this.__actions__);
          var G = [];
          t:
            for (; _-- && W < X; ) {
              P += r;
              for (var J = -1, V = t[P]; ++J < O; ) {
                var et = j[J], ut = et.iteratee, yr = et.type, er = ut(V);
                if (yr == mt)
                  V = er;
                else if (!er) {
                  if (yr == rt)
                    continue t;
                  break t;
                }
              }
              G[W++] = V;
            }
          return G;
        }
        ot.prototype = cn(Di.prototype), ot.prototype.constructor = ot;
        function Ie(t) {
          var r = -1, n = t == null ? 0 : t.length;
          for (this.clear(); ++r < n; ) {
            var l = t[r];
            this.set(l[0], l[1]);
          }
        }
        function bd() {
          this.__data__ = Ln ? Ln(null) : {}, this.size = 0;
        }
        function _d(t) {
          var r = this.has(t) && delete this.__data__[t];
          return this.size -= r ? 1 : 0, r;
        }
        function xd(t) {
          var r = this.__data__;
          if (Ln) {
            var n = r[t];
            return n === p ? i : n;
          }
          return wt.call(r, t) ? r[t] : i;
        }
        function Rd(t) {
          var r = this.__data__;
          return Ln ? r[t] !== i : wt.call(r, t);
        }
        function Cd(t, r) {
          var n = this.__data__;
          return this.size += this.has(t) ? 0 : 1, n[t] = Ln && r === i ? p : r, this;
        }
        Ie.prototype.clear = bd, Ie.prototype.delete = _d, Ie.prototype.get = xd, Ie.prototype.has = Rd, Ie.prototype.set = Cd;
        function ne(t) {
          var r = -1, n = t == null ? 0 : t.length;
          for (this.clear(); ++r < n; ) {
            var l = t[r];
            this.set(l[0], l[1]);
          }
        }
        function kd() {
          this.__data__ = [], this.size = 0;
        }
        function Sd(t) {
          var r = this.__data__, n = Ii(r, t);
          if (n < 0)
            return !1;
          var l = r.length - 1;
          return n == l ? r.pop() : Ei.call(r, n, 1), --this.size, !0;
        }
        function zd(t) {
          var r = this.__data__, n = Ii(r, t);
          return n < 0 ? i : r[n][1];
        }
        function Pd(t) {
          return Ii(this.__data__, t) > -1;
        }
        function Ed(t, r) {
          var n = this.__data__, l = Ii(n, t);
          return l < 0 ? (++this.size, n.push([t, r])) : n[l][1] = r, this;
        }
        ne.prototype.clear = kd, ne.prototype.delete = Sd, ne.prototype.get = zd, ne.prototype.has = Pd, ne.prototype.set = Ed;
        function ie(t) {
          var r = -1, n = t == null ? 0 : t.length;
          for (this.clear(); ++r < n; ) {
            var l = t[r];
            this.set(l[0], l[1]);
          }
        }
        function jd() {
          this.size = 0, this.__data__ = {
            hash: new Ie(),
            map: new (In || ne)(),
            string: new Ie()
          };
        }
        function Ad(t) {
          var r = Gi(this, t).delete(t);
          return this.size -= r ? 1 : 0, r;
        }
        function Od(t) {
          return Gi(this, t).get(t);
        }
        function Hd(t) {
          return Gi(this, t).has(t);
        }
        function Md(t, r) {
          var n = Gi(this, t), l = n.size;
          return n.set(t, r), this.size += n.size == l ? 0 : 1, this;
        }
        ie.prototype.clear = jd, ie.prototype.delete = Ad, ie.prototype.get = Od, ie.prototype.has = Hd, ie.prototype.set = Md;
        function We(t) {
          var r = -1, n = t == null ? 0 : t.length;
          for (this.__data__ = new ie(); ++r < n; )
            this.add(t[r]);
        }
        function Dd(t) {
          return this.__data__.set(t, p), this;
        }
        function Id(t) {
          return this.__data__.has(t);
        }
        We.prototype.add = We.prototype.push = Dd, We.prototype.has = Id;
        function qr(t) {
          var r = this.__data__ = new ne(t);
          this.size = r.size;
        }
        function Wd() {
          this.__data__ = new ne(), this.size = 0;
        }
        function Ld(t) {
          var r = this.__data__, n = r.delete(t);
          return this.size = r.size, n;
        }
        function Td(t) {
          return this.__data__.get(t);
        }
        function Nd(t) {
          return this.__data__.has(t);
        }
        function $d(t, r) {
          var n = this.__data__;
          if (n instanceof ne) {
            var l = n.__data__;
            if (!In || l.length < s - 1)
              return l.push([t, r]), this.size = ++n.size, this;
            n = this.__data__ = new ie(l);
          }
          return n.set(t, r), this.size = n.size, this;
        }
        qr.prototype.clear = Wd, qr.prototype.delete = Ld, qr.prototype.get = Td, qr.prototype.has = Nd, qr.prototype.set = $d;
        function Ga(t, r) {
          var n = Z(t), l = !n && qe(t), a = !n && !l && ke(t), h = !n && !l && !a && dn(t), g = n || l || a || h, m = g ? Jo(t.length, Zv) : [], _ = m.length;
          for (var P in t)
            (r || wt.call(t, P)) && !(g && // Safari 9 has enumerable `arguments.length` in strict mode.
            (P == "length" || // Node.js 0.10 has enumerable non-index properties on buffers.
            a && (P == "offset" || P == "parent") || // PhantomJS 2 has enumerable non-index properties on typed arrays.
            h && (P == "buffer" || P == "byteLength" || P == "byteOffset") || // Skip index properties.
            ae(P, _))) && m.push(P);
          return m;
        }
        function Va(t) {
          var r = t.length;
          return r ? t[pl(0, r - 1)] : i;
        }
        function qd(t, r) {
          return Vi(or(t), Le(r, 0, t.length));
        }
        function Fd(t) {
          return Vi(or(t));
        }
        function ll(t, r, n) {
          (n !== i && !Fr(t[r], n) || n === i && !(r in t)) && oe(t, r, n);
        }
        function Nn(t, r, n) {
          var l = t[r];
          (!(wt.call(t, r) && Fr(l, n)) || n === i && !(r in t)) && oe(t, r, n);
        }
        function Ii(t, r) {
          for (var n = t.length; n--; )
            if (Fr(t[n][0], r))
              return n;
          return -1;
        }
        function Bd(t, r, n, l) {
          return _e(t, function(a, h, g) {
            r(l, a, n(a), g);
          }), l;
        }
        function Ya(t, r) {
          return t && Vr(r, Ft(r), t);
        }
        function Ud(t, r) {
          return t && Vr(r, ur(r), t);
        }
        function oe(t, r, n) {
          r == "__proto__" && ji ? ji(t, r, {
            configurable: !0,
            enumerable: !0,
            value: n,
            writable: !0
          }) : t[r] = n;
        }
        function ul(t, r) {
          for (var n = -1, l = r.length, a = R(l), h = t == null; ++n < l; )
            a[n] = h ? i : $l(t, r[n]);
          return a;
        }
        function Le(t, r, n) {
          return t === t && (n !== i && (t = t <= n ? t : n), r !== i && (t = t >= r ? t : r)), t;
        }
        function Er(t, r, n, l, a, h) {
          var g, m = r & S, _ = r & z, P = r & E;
          if (n && (g = a ? n(t, l, a, h) : n(t)), g !== i)
            return g;
          if (!zt(t))
            return t;
          var j = Z(t);
          if (j) {
            if (g = Hg(t), !m)
              return or(t, g);
          } else {
            var O = Vt(t), W = O == di || O == Qu;
            if (ke(t))
              return bs(t, m);
            if (O == ee || O == Je || W && !a) {
              if (g = _ || W ? {} : Ts(t), !m)
                return _ ? xg(t, Ud(g, t)) : _g(t, Ya(g, t));
            } else {
              if (!Rt[O])
                return a ? t : {};
              g = Mg(t, O, m);
            }
          }
          h || (h = new qr());
          var X = h.get(t);
          if (X)
            return X;
          h.set(t, g), dc(t) ? t.forEach(function(V) {
            g.add(Er(V, r, n, V, t, h));
          }) : hc(t) && t.forEach(function(V, et) {
            g.set(et, Er(V, r, n, et, t, h));
          });
          var G = P ? _ ? zl : Sl : _ ? ur : Ft, J = j ? i : G(t);
          return Sr(J || t, function(V, et) {
            J && (et = V, V = t[et]), Nn(g, et, Er(V, r, n, et, t, h));
          }), g;
        }
        function Xd(t) {
          var r = Ft(t);
          return function(n) {
            return Za(n, t, r);
          };
        }
        function Za(t, r, n) {
          var l = n.length;
          if (t == null)
            return !l;
          for (t = _t(t); l--; ) {
            var a = n[l], h = r[a], g = t[a];
            if (g === i && !(a in t) || !h(g))
              return !1;
          }
          return !0;
        }
        function Qa(t, r, n) {
          if (typeof t != "function")
            throw new zr(v);
          return Kn(function() {
            t.apply(i, n);
          }, r);
        }
        function $n(t, r, n, l) {
          var a = -1, h = yi, g = !0, m = t.length, _ = [], P = r.length;
          if (!m)
            return _;
          n && (r = St(r, pr(n))), l ? (h = Ko, g = !1) : r.length >= s && (h = Mn, g = !1, r = new We(r));
          t:
            for (; ++a < m; ) {
              var j = t[a], O = n == null ? j : n(j);
              if (j = l || j !== 0 ? j : 0, g && O === O) {
                for (var W = P; W--; )
                  if (r[W] === O)
                    continue t;
                _.push(j);
              } else h(r, O, l) || _.push(j);
            }
          return _;
        }
        var _e = ks(Gr), Ja = ks(sl, !0);
        function Kd(t, r) {
          var n = !0;
          return _e(t, function(l, a, h) {
            return n = !!r(l, a, h), n;
          }), n;
        }
        function Wi(t, r, n) {
          for (var l = -1, a = t.length; ++l < a; ) {
            var h = t[l], g = r(h);
            if (g != null && (m === i ? g === g && !wr(g) : n(g, m)))
              var m = g, _ = h;
          }
          return _;
        }
        function Gd(t, r, n, l) {
          var a = t.length;
          for (n = Q(n), n < 0 && (n = -n > a ? 0 : a + n), l = l === i || l > a ? a : Q(l), l < 0 && (l += a), l = n > l ? 0 : pc(l); n < l; )
            t[n++] = r;
          return t;
        }
        function ts(t, r) {
          var n = [];
          return _e(t, function(l, a, h) {
            r(l, a, h) && n.push(l);
          }), n;
        }
        function Xt(t, r, n, l, a) {
          var h = -1, g = t.length;
          for (n || (n = Ig), a || (a = []); ++h < g; ) {
            var m = t[h];
            r > 0 && n(m) ? r > 1 ? Xt(m, r - 1, n, l, a) : we(a, m) : l || (a[a.length] = m);
          }
          return a;
        }
        var al = Ss(), rs = Ss(!0);
        function Gr(t, r) {
          return t && al(t, r, Ft);
        }
        function sl(t, r) {
          return t && rs(t, r, Ft);
        }
        function Li(t, r) {
          return me(r, function(n) {
            return se(t[n]);
          });
        }
        function Te(t, r) {
          r = Re(r, t);
          for (var n = 0, l = r.length; t != null && n < l; )
            t = t[Yr(r[n++])];
          return n && n == l ? t : i;
        }
        function es(t, r, n) {
          var l = r(t);
          return Z(t) ? l : we(l, n(t));
        }
        function tr(t) {
          return t == null ? t === i ? Rh : _h : De && De in _t(t) ? jg(t) : Fg(t);
        }
        function cl(t, r) {
          return t > r;
        }
        function Vd(t, r) {
          return t != null && wt.call(t, r);
        }
        function Yd(t, r) {
          return t != null && r in _t(t);
        }
        function Zd(t, r, n) {
          return t >= Gt(r, n) && t < $t(r, n);
        }
        function fl(t, r, n) {
          for (var l = n ? Ko : yi, a = t[0].length, h = t.length, g = h, m = R(h), _ = 1 / 0, P = []; g--; ) {
            var j = t[g];
            g && r && (j = St(j, pr(r))), _ = Gt(j.length, _), m[g] = !n && (r || a >= 120 && j.length >= 120) ? new We(g && j) : i;
          }
          j = t[0];
          var O = -1, W = m[0];
          t:
            for (; ++O < a && P.length < _; ) {
              var X = j[O], G = r ? r(X) : X;
              if (X = n || X !== 0 ? X : 0, !(W ? Mn(W, G) : l(P, G, n))) {
                for (g = h; --g; ) {
                  var J = m[g];
                  if (!(J ? Mn(J, G) : l(t[g], G, n)))
                    continue t;
                }
                W && W.push(G), P.push(X);
              }
            }
          return P;
        }
        function Qd(t, r, n, l) {
          return Gr(t, function(a, h, g) {
            r(l, n(a), h, g);
          }), l;
        }
        function qn(t, r, n) {
          r = Re(r, t), t = Fs(t, r);
          var l = t == null ? t : t[Yr(Ar(r))];
          return l == null ? i : gr(l, t, n);
        }
        function ns(t) {
          return jt(t) && tr(t) == Je;
        }
        function Jd(t) {
          return jt(t) && tr(t) == Hn;
        }
        function tg(t) {
          return jt(t) && tr(t) == Pn;
        }
        function Fn(t, r, n, l, a) {
          return t === r ? !0 : t == null || r == null || !jt(t) && !jt(r) ? t !== t && r !== r : rg(t, r, n, l, Fn, a);
        }
        function rg(t, r, n, l, a, h) {
          var g = Z(t), m = Z(r), _ = g ? hi : Vt(t), P = m ? hi : Vt(r);
          _ = _ == Je ? ee : _, P = P == Je ? ee : P;
          var j = _ == ee, O = P == ee, W = _ == P;
          if (W && ke(t)) {
            if (!ke(r))
              return !1;
            g = !0, j = !1;
          }
          if (W && !j)
            return h || (h = new qr()), g || dn(t) ? Is(t, r, n, l, a, h) : Pg(t, r, _, n, l, a, h);
          if (!(n & k)) {
            var X = j && wt.call(t, "__wrapped__"), G = O && wt.call(r, "__wrapped__");
            if (X || G) {
              var J = X ? t.value() : t, V = G ? r.value() : r;
              return h || (h = new qr()), a(J, V, n, l, h);
            }
          }
          return W ? (h || (h = new qr()), Eg(t, r, n, l, a, h)) : !1;
        }
        function eg(t) {
          return jt(t) && Vt(t) == Tr;
        }
        function hl(t, r, n, l) {
          var a = n.length, h = a, g = !l;
          if (t == null)
            return !h;
          for (t = _t(t); a--; ) {
            var m = n[a];
            if (g && m[2] ? m[1] !== t[m[0]] : !(m[0] in t))
              return !1;
          }
          for (; ++a < h; ) {
            m = n[a];
            var _ = m[0], P = t[_], j = m[1];
            if (g && m[2]) {
              if (P === i && !(_ in t))
                return !1;
            } else {
              var O = new qr();
              if (l)
                var W = l(P, j, _, t, r, O);
              if (!(W === i ? Fn(j, P, k | D, l, O) : W))
                return !1;
            }
          }
          return !0;
        }
        function is(t) {
          if (!zt(t) || Lg(t))
            return !1;
          var r = se(t) ? ed : Xh;
          return r.test($e(t));
        }
        function ng(t) {
          return jt(t) && tr(t) == jn;
        }
        function ig(t) {
          return jt(t) && Vt(t) == Nr;
        }
        function og(t) {
          return jt(t) && ro(t.length) && !!Ct[tr(t)];
        }
        function os(t) {
          return typeof t == "function" ? t : t == null ? ar : typeof t == "object" ? Z(t) ? as(t[0], t[1]) : us(t) : zc(t);
        }
        function vl(t) {
          if (!Xn(t))
            return ad(t);
          var r = [];
          for (var n in _t(t))
            wt.call(t, n) && n != "constructor" && r.push(n);
          return r;
        }
        function lg(t) {
          if (!zt(t))
            return qg(t);
          var r = Xn(t), n = [];
          for (var l in t)
            l == "constructor" && (r || !wt.call(t, l)) || n.push(l);
          return n;
        }
        function dl(t, r) {
          return t < r;
        }
        function ls(t, r) {
          var n = -1, l = lr(t) ? R(t.length) : [];
          return _e(t, function(a, h, g) {
            l[++n] = r(a, h, g);
          }), l;
        }
        function us(t) {
          var r = El(t);
          return r.length == 1 && r[0][2] ? $s(r[0][0], r[0][1]) : function(n) {
            return n === t || hl(n, t, r);
          };
        }
        function as(t, r) {
          return Al(t) && Ns(r) ? $s(Yr(t), r) : function(n) {
            var l = $l(n, t);
            return l === i && l === r ? ql(n, t) : Fn(r, l, k | D);
          };
        }
        function Ti(t, r, n, l, a) {
          t !== r && al(r, function(h, g) {
            if (a || (a = new qr()), zt(h))
              ug(t, r, g, n, Ti, l, a);
            else {
              var m = l ? l(Hl(t, g), h, g + "", t, r, a) : i;
              m === i && (m = h), ll(t, g, m);
            }
          }, ur);
        }
        function ug(t, r, n, l, a, h, g) {
          var m = Hl(t, n), _ = Hl(r, n), P = g.get(_);
          if (P) {
            ll(t, n, P);
            return;
          }
          var j = h ? h(m, _, n + "", t, r, g) : i, O = j === i;
          if (O) {
            var W = Z(_), X = !W && ke(_), G = !W && !X && dn(_);
            j = _, W || X || G ? Z(m) ? j = m : Ht(m) ? j = or(m) : X ? (O = !1, j = bs(_, !0)) : G ? (O = !1, j = _s(_, !0)) : j = [] : Gn(_) || qe(_) ? (j = m, qe(m) ? j = mc(m) : (!zt(m) || se(m)) && (j = Ts(_))) : O = !1;
          }
          O && (g.set(_, j), a(j, _, l, h, g), g.delete(_)), ll(t, n, j);
        }
        function ss(t, r) {
          var n = t.length;
          if (n)
            return r += r < 0 ? n : 0, ae(r, n) ? t[r] : i;
        }
        function cs(t, r, n) {
          r.length ? r = St(r, function(h) {
            return Z(h) ? function(g) {
              return Te(g, h.length === 1 ? h[0] : h);
            } : h;
          }) : r = [ar];
          var l = -1;
          r = St(r, pr(K()));
          var a = ls(t, function(h, g, m) {
            var _ = St(r, function(P) {
              return P(h);
            });
            return { criteria: _, index: ++l, value: h };
          });
          return Mv(a, function(h, g) {
            return bg(h, g, n);
          });
        }
        function ag(t, r) {
          return fs(t, r, function(n, l) {
            return ql(t, l);
          });
        }
        function fs(t, r, n) {
          for (var l = -1, a = r.length, h = {}; ++l < a; ) {
            var g = r[l], m = Te(t, g);
            n(m, g) && Bn(h, Re(g, t), m);
          }
          return h;
        }
        function sg(t) {
          return function(r) {
            return Te(r, t);
          };
        }
        function gl(t, r, n, l) {
          var a = l ? Hv : en, h = -1, g = r.length, m = t;
          for (t === r && (r = or(r)), n && (m = St(t, pr(n))); ++h < g; )
            for (var _ = 0, P = r[h], j = n ? n(P) : P; (_ = a(m, j, _, l)) > -1; )
              m !== t && Ei.call(m, _, 1), Ei.call(t, _, 1);
          return t;
        }
        function hs(t, r) {
          for (var n = t ? r.length : 0, l = n - 1; n--; ) {
            var a = r[n];
            if (n == l || a !== h) {
              var h = a;
              ae(a) ? Ei.call(t, a, 1) : yl(t, a);
            }
          }
          return t;
        }
        function pl(t, r) {
          return t + Oi(Xa() * (r - t + 1));
        }
        function cg(t, r, n, l) {
          for (var a = -1, h = $t(Ai((r - t) / (n || 1)), 0), g = R(h); h--; )
            g[l ? h : ++a] = t, t += n;
          return g;
        }
        function ml(t, r) {
          var n = "";
          if (!t || r < 1 || r > ir)
            return n;
          do
            r % 2 && (n += t), r = Oi(r / 2), r && (t += t);
          while (r);
          return n;
        }
        function tt(t, r) {
          return Ml(qs(t, r, ar), t + "");
        }
        function fg(t) {
          return Va(gn(t));
        }
        function hg(t, r) {
          var n = gn(t);
          return Vi(n, Le(r, 0, n.length));
        }
        function Bn(t, r, n, l) {
          if (!zt(t))
            return t;
          r = Re(r, t);
          for (var a = -1, h = r.length, g = h - 1, m = t; m != null && ++a < h; ) {
            var _ = Yr(r[a]), P = n;
            if (_ === "__proto__" || _ === "constructor" || _ === "prototype")
              return t;
            if (a != g) {
              var j = m[_];
              P = l ? l(j, _, m) : i, P === i && (P = zt(j) ? j : ae(r[a + 1]) ? [] : {});
            }
            Nn(m, _, P), m = m[_];
          }
          return t;
        }
        var vs = Hi ? function(t, r) {
          return Hi.set(t, r), t;
        } : ar, vg = ji ? function(t, r) {
          return ji(t, "toString", {
            configurable: !0,
            enumerable: !1,
            value: Bl(r),
            writable: !0
          });
        } : ar;
        function dg(t) {
          return Vi(gn(t));
        }
        function jr(t, r, n) {
          var l = -1, a = t.length;
          r < 0 && (r = -r > a ? 0 : a + r), n = n > a ? a : n, n < 0 && (n += a), a = r > n ? 0 : n - r >>> 0, r >>>= 0;
          for (var h = R(a); ++l < a; )
            h[l] = t[l + r];
          return h;
        }
        function gg(t, r) {
          var n;
          return _e(t, function(l, a, h) {
            return n = r(l, a, h), !n;
          }), !!n;
        }
        function Ni(t, r, n) {
          var l = 0, a = t == null ? l : t.length;
          if (typeof r == "number" && r === r && a <= Sn) {
            for (; l < a; ) {
              var h = l + a >>> 1, g = t[h];
              g !== null && !wr(g) && (n ? g <= r : g < r) ? l = h + 1 : a = h;
            }
            return a;
          }
          return wl(t, r, ar, n);
        }
        function wl(t, r, n, l) {
          var a = 0, h = t == null ? 0 : t.length;
          if (h === 0)
            return 0;
          r = n(r);
          for (var g = r !== r, m = r === null, _ = wr(r), P = r === i; a < h; ) {
            var j = Oi((a + h) / 2), O = n(t[j]), W = O !== i, X = O === null, G = O === O, J = wr(O);
            if (g)
              var V = l || G;
            else P ? V = G && (l || W) : m ? V = G && W && (l || !X) : _ ? V = G && W && !X && (l || !J) : X || J ? V = !1 : V = l ? O <= r : O < r;
            V ? a = j + 1 : h = j;
          }
          return Gt(h, zo);
        }
        function ds(t, r) {
          for (var n = -1, l = t.length, a = 0, h = []; ++n < l; ) {
            var g = t[n], m = r ? r(g) : g;
            if (!n || !Fr(m, _)) {
              var _ = m;
              h[a++] = g === 0 ? 0 : g;
            }
          }
          return h;
        }
        function gs(t) {
          return typeof t == "number" ? t : wr(t) ? Cr : +t;
        }
        function mr(t) {
          if (typeof t == "string")
            return t;
          if (Z(t))
            return St(t, mr) + "";
          if (wr(t))
            return Ka ? Ka.call(t) : "";
          var r = t + "";
          return r == "0" && 1 / t == -qt ? "-0" : r;
        }
        function xe(t, r, n) {
          var l = -1, a = yi, h = t.length, g = !0, m = [], _ = m;
          if (n)
            g = !1, a = Ko;
          else if (h >= s) {
            var P = r ? null : Sg(t);
            if (P)
              return _i(P);
            g = !1, a = Mn, _ = new We();
          } else
            _ = r ? [] : m;
          t:
            for (; ++l < h; ) {
              var j = t[l], O = r ? r(j) : j;
              if (j = n || j !== 0 ? j : 0, g && O === O) {
                for (var W = _.length; W--; )
                  if (_[W] === O)
                    continue t;
                r && _.push(O), m.push(j);
              } else a(_, O, n) || (_ !== m && _.push(O), m.push(j));
            }
          return m;
        }
        function yl(t, r) {
          return r = Re(r, t), t = Fs(t, r), t == null || delete t[Yr(Ar(r))];
        }
        function ps(t, r, n, l) {
          return Bn(t, r, n(Te(t, r)), l);
        }
        function $i(t, r, n, l) {
          for (var a = t.length, h = l ? a : -1; (l ? h-- : ++h < a) && r(t[h], h, t); )
            ;
          return n ? jr(t, l ? 0 : h, l ? h + 1 : a) : jr(t, l ? h + 1 : 0, l ? a : h);
        }
        function ms(t, r) {
          var n = t;
          return n instanceof ot && (n = n.value()), Go(r, function(l, a) {
            return a.func.apply(a.thisArg, we([l], a.args));
          }, n);
        }
        function bl(t, r, n) {
          var l = t.length;
          if (l < 2)
            return l ? xe(t[0]) : [];
          for (var a = -1, h = R(l); ++a < l; )
            for (var g = t[a], m = -1; ++m < l; )
              m != a && (h[a] = $n(h[a] || g, t[m], r, n));
          return xe(Xt(h, 1), r, n);
        }
        function ws(t, r, n) {
          for (var l = -1, a = t.length, h = r.length, g = {}; ++l < a; ) {
            var m = l < h ? r[l] : i;
            n(g, t[l], m);
          }
          return g;
        }
        function _l(t) {
          return Ht(t) ? t : [];
        }
        function xl(t) {
          return typeof t == "function" ? t : ar;
        }
        function Re(t, r) {
          return Z(t) ? t : Al(t, r) ? [t] : Ks(gt(t));
        }
        var pg = tt;
        function Ce(t, r, n) {
          var l = t.length;
          return n = n === i ? l : n, !r && n >= l ? t : jr(t, r, n);
        }
        var ys = nd || function(t) {
          return Ut.clearTimeout(t);
        };
        function bs(t, r) {
          if (r)
            return t.slice();
          var n = t.length, l = $a ? $a(n) : new t.constructor(n);
          return t.copy(l), l;
        }
        function Rl(t) {
          var r = new t.constructor(t.byteLength);
          return new zi(r).set(new zi(t)), r;
        }
        function mg(t, r) {
          var n = r ? Rl(t.buffer) : t.buffer;
          return new t.constructor(n, t.byteOffset, t.byteLength);
        }
        function wg(t) {
          var r = new t.constructor(t.source, na.exec(t));
          return r.lastIndex = t.lastIndex, r;
        }
        function yg(t) {
          return Tn ? _t(Tn.call(t)) : {};
        }
        function _s(t, r) {
          var n = r ? Rl(t.buffer) : t.buffer;
          return new t.constructor(n, t.byteOffset, t.length);
        }
        function xs(t, r) {
          if (t !== r) {
            var n = t !== i, l = t === null, a = t === t, h = wr(t), g = r !== i, m = r === null, _ = r === r, P = wr(r);
            if (!m && !P && !h && t > r || h && g && _ && !m && !P || l && g && _ || !n && _ || !a)
              return 1;
            if (!l && !h && !P && t < r || P && n && a && !l && !h || m && n && a || !g && a || !_)
              return -1;
          }
          return 0;
        }
        function bg(t, r, n) {
          for (var l = -1, a = t.criteria, h = r.criteria, g = a.length, m = n.length; ++l < g; ) {
            var _ = xs(a[l], h[l]);
            if (_) {
              if (l >= m)
                return _;
              var P = n[l];
              return _ * (P == "desc" ? -1 : 1);
            }
          }
          return t.index - r.index;
        }
        function Rs(t, r, n, l) {
          for (var a = -1, h = t.length, g = n.length, m = -1, _ = r.length, P = $t(h - g, 0), j = R(_ + P), O = !l; ++m < _; )
            j[m] = r[m];
          for (; ++a < g; )
            (O || a < h) && (j[n[a]] = t[a]);
          for (; P--; )
            j[m++] = t[a++];
          return j;
        }
        function Cs(t, r, n, l) {
          for (var a = -1, h = t.length, g = -1, m = n.length, _ = -1, P = r.length, j = $t(h - m, 0), O = R(j + P), W = !l; ++a < j; )
            O[a] = t[a];
          for (var X = a; ++_ < P; )
            O[X + _] = r[_];
          for (; ++g < m; )
            (W || a < h) && (O[X + n[g]] = t[a++]);
          return O;
        }
        function or(t, r) {
          var n = -1, l = t.length;
          for (r || (r = R(l)); ++n < l; )
            r[n] = t[n];
          return r;
        }
        function Vr(t, r, n, l) {
          var a = !n;
          n || (n = {});
          for (var h = -1, g = r.length; ++h < g; ) {
            var m = r[h], _ = l ? l(n[m], t[m], m, n, t) : i;
            _ === i && (_ = t[m]), a ? oe(n, m, _) : Nn(n, m, _);
          }
          return n;
        }
        function _g(t, r) {
          return Vr(t, jl(t), r);
        }
        function xg(t, r) {
          return Vr(t, Ws(t), r);
        }
        function qi(t, r) {
          return function(n, l) {
            var a = Z(n) ? zv : Bd, h = r ? r() : {};
            return a(n, t, K(l, 2), h);
          };
        }
        function fn(t) {
          return tt(function(r, n) {
            var l = -1, a = n.length, h = a > 1 ? n[a - 1] : i, g = a > 2 ? n[2] : i;
            for (h = t.length > 3 && typeof h == "function" ? (a--, h) : i, g && rr(n[0], n[1], g) && (h = a < 3 ? i : h, a = 1), r = _t(r); ++l < a; ) {
              var m = n[l];
              m && t(r, m, l, h);
            }
            return r;
          });
        }
        function ks(t, r) {
          return function(n, l) {
            if (n == null)
              return n;
            if (!lr(n))
              return t(n, l);
            for (var a = n.length, h = r ? a : -1, g = _t(n); (r ? h-- : ++h < a) && l(g[h], h, g) !== !1; )
              ;
            return n;
          };
        }
        function Ss(t) {
          return function(r, n, l) {
            for (var a = -1, h = _t(r), g = l(r), m = g.length; m--; ) {
              var _ = g[t ? m : ++a];
              if (n(h[_], _, h) === !1)
                break;
            }
            return r;
          };
        }
        function Rg(t, r, n) {
          var l = r & H, a = Un(t);
          function h() {
            var g = this && this !== Ut && this instanceof h ? a : t;
            return g.apply(l ? n : this, arguments);
          }
          return h;
        }
        function zs(t) {
          return function(r) {
            r = gt(r);
            var n = nn(r) ? $r(r) : i, l = n ? n[0] : r.charAt(0), a = n ? Ce(n, 1).join("") : r.slice(1);
            return l[t]() + a;
          };
        }
        function hn(t) {
          return function(r) {
            return Go(kc(Cc(r).replace(vv, "")), t, "");
          };
        }
        function Un(t) {
          return function() {
            var r = arguments;
            switch (r.length) {
              case 0:
                return new t();
              case 1:
                return new t(r[0]);
              case 2:
                return new t(r[0], r[1]);
              case 3:
                return new t(r[0], r[1], r[2]);
              case 4:
                return new t(r[0], r[1], r[2], r[3]);
              case 5:
                return new t(r[0], r[1], r[2], r[3], r[4]);
              case 6:
                return new t(r[0], r[1], r[2], r[3], r[4], r[5]);
              case 7:
                return new t(r[0], r[1], r[2], r[3], r[4], r[5], r[6]);
            }
            var n = cn(t.prototype), l = t.apply(n, r);
            return zt(l) ? l : n;
          };
        }
        function Cg(t, r, n) {
          var l = Un(t);
          function a() {
            for (var h = arguments.length, g = R(h), m = h, _ = vn(a); m--; )
              g[m] = arguments[m];
            var P = h < 3 && g[0] !== _ && g[h - 1] !== _ ? [] : ye(g, _);
            if (h -= P.length, h < n)
              return Os(
                t,
                r,
                Fi,
                a.placeholder,
                i,
                g,
                P,
                i,
                i,
                n - h
              );
            var j = this && this !== Ut && this instanceof a ? l : t;
            return gr(j, this, g);
          }
          return a;
        }
        function Ps(t) {
          return function(r, n, l) {
            var a = _t(r);
            if (!lr(r)) {
              var h = K(n, 3);
              r = Ft(r), n = function(m) {
                return h(a[m], m, a);
              };
            }
            var g = t(r, n, l);
            return g > -1 ? a[h ? r[g] : g] : i;
          };
        }
        function Es(t) {
          return ue(function(r) {
            var n = r.length, l = n, a = Pr.prototype.thru;
            for (t && r.reverse(); l--; ) {
              var h = r[l];
              if (typeof h != "function")
                throw new zr(v);
              if (a && !g && Ki(h) == "wrapper")
                var g = new Pr([], !0);
            }
            for (l = g ? l : n; ++l < n; ) {
              h = r[l];
              var m = Ki(h), _ = m == "wrapper" ? Pl(h) : i;
              _ && Ol(_[0]) && _[1] == (T | U | N | ct) && !_[4].length && _[9] == 1 ? g = g[Ki(_[0])].apply(g, _[3]) : g = h.length == 1 && Ol(h) ? g[m]() : g.thru(h);
            }
            return function() {
              var P = arguments, j = P[0];
              if (g && P.length == 1 && Z(j))
                return g.plant(j).value();
              for (var O = 0, W = n ? r[O].apply(this, P) : j; ++O < n; )
                W = r[O].call(this, W);
              return W;
            };
          });
        }
        function Fi(t, r, n, l, a, h, g, m, _, P) {
          var j = r & T, O = r & H, W = r & L, X = r & (U | q), G = r & it, J = W ? i : Un(t);
          function V() {
            for (var et = arguments.length, ut = R(et), yr = et; yr--; )
              ut[yr] = arguments[yr];
            if (X)
              var er = vn(V), br = Iv(ut, er);
            if (l && (ut = Rs(ut, l, a, X)), h && (ut = Cs(ut, h, g, X)), et -= br, X && et < P) {
              var Mt = ye(ut, er);
              return Os(
                t,
                r,
                Fi,
                V.placeholder,
                n,
                ut,
                Mt,
                m,
                _,
                P - et
              );
            }
            var Br = O ? n : this, fe = W ? Br[t] : t;
            return et = ut.length, m ? ut = Bg(ut, m) : G && et > 1 && ut.reverse(), j && _ < et && (ut.length = _), this && this !== Ut && this instanceof V && (fe = J || Un(fe)), fe.apply(Br, ut);
          }
          return V;
        }
        function js(t, r) {
          return function(n, l) {
            return Qd(n, t, r(l), {});
          };
        }
        function Bi(t, r) {
          return function(n, l) {
            var a;
            if (n === i && l === i)
              return r;
            if (n !== i && (a = n), l !== i) {
              if (a === i)
                return l;
              typeof n == "string" || typeof l == "string" ? (n = mr(n), l = mr(l)) : (n = gs(n), l = gs(l)), a = t(n, l);
            }
            return a;
          };
        }
        function Cl(t) {
          return ue(function(r) {
            return r = St(r, pr(K())), tt(function(n) {
              var l = this;
              return t(r, function(a) {
                return gr(a, l, n);
              });
            });
          });
        }
        function Ui(t, r) {
          r = r === i ? " " : mr(r);
          var n = r.length;
          if (n < 2)
            return n ? ml(r, t) : r;
          var l = ml(r, Ai(t / on(r)));
          return nn(r) ? Ce($r(l), 0, t).join("") : l.slice(0, t);
        }
        function kg(t, r, n, l) {
          var a = r & H, h = Un(t);
          function g() {
            for (var m = -1, _ = arguments.length, P = -1, j = l.length, O = R(j + _), W = this && this !== Ut && this instanceof g ? h : t; ++P < j; )
              O[P] = l[P];
            for (; _--; )
              O[P++] = arguments[++m];
            return gr(W, a ? n : this, O);
          }
          return g;
        }
        function As(t) {
          return function(r, n, l) {
            return l && typeof l != "number" && rr(r, n, l) && (n = l = i), r = ce(r), n === i ? (n = r, r = 0) : n = ce(n), l = l === i ? r < n ? 1 : -1 : ce(l), cg(r, n, l, t);
          };
        }
        function Xi(t) {
          return function(r, n) {
            return typeof r == "string" && typeof n == "string" || (r = Or(r), n = Or(n)), t(r, n);
          };
        }
        function Os(t, r, n, l, a, h, g, m, _, P) {
          var j = r & U, O = j ? g : i, W = j ? i : g, X = j ? h : i, G = j ? i : h;
          r |= j ? N : B, r &= ~(j ? B : N), r & I || (r &= -4);
          var J = [
            t,
            r,
            a,
            X,
            O,
            G,
            W,
            m,
            _,
            P
          ], V = n.apply(i, J);
          return Ol(t) && Bs(V, J), V.placeholder = l, Us(V, t, r);
        }
        function kl(t) {
          var r = Nt[t];
          return function(n, l) {
            if (n = Or(n), l = l == null ? 0 : Gt(Q(l), 292), l && Ua(n)) {
              var a = (gt(n) + "e").split("e"), h = r(a[0] + "e" + (+a[1] + l));
              return a = (gt(h) + "e").split("e"), +(a[0] + "e" + (+a[1] - l));
            }
            return r(n);
          };
        }
        var Sg = an && 1 / _i(new an([, -0]))[1] == qt ? function(t) {
          return new an(t);
        } : Kl;
        function Hs(t) {
          return function(r) {
            var n = Vt(r);
            return n == Tr ? rl(r) : n == Nr ? Fv(r) : Dv(r, t(r));
          };
        }
        function le(t, r, n, l, a, h, g, m) {
          var _ = r & L;
          if (!_ && typeof t != "function")
            throw new zr(v);
          var P = l ? l.length : 0;
          if (P || (r &= -97, l = a = i), g = g === i ? g : $t(Q(g), 0), m = m === i ? m : Q(m), P -= a ? a.length : 0, r & B) {
            var j = l, O = a;
            l = a = i;
          }
          var W = _ ? i : Pl(t), X = [
            t,
            r,
            n,
            l,
            a,
            j,
            O,
            h,
            g,
            m
          ];
          if (W && $g(X, W), t = X[0], r = X[1], n = X[2], l = X[3], a = X[4], m = X[9] = X[9] === i ? _ ? 0 : t.length : $t(X[9] - P, 0), !m && r & (U | q) && (r &= -25), !r || r == H)
            var G = Rg(t, r, n);
          else r == U || r == q ? G = Cg(t, r, m) : (r == N || r == (H | N)) && !a.length ? G = kg(t, r, n, l) : G = Fi.apply(i, X);
          var J = W ? vs : Bs;
          return Us(J(G, X), t, r);
        }
        function Ms(t, r, n, l) {
          return t === i || Fr(t, un[n]) && !wt.call(l, n) ? r : t;
        }
        function Ds(t, r, n, l, a, h) {
          return zt(t) && zt(r) && (h.set(r, t), Ti(t, r, i, Ds, h), h.delete(r)), t;
        }
        function zg(t) {
          return Gn(t) ? i : t;
        }
        function Is(t, r, n, l, a, h) {
          var g = n & k, m = t.length, _ = r.length;
          if (m != _ && !(g && _ > m))
            return !1;
          var P = h.get(t), j = h.get(r);
          if (P && j)
            return P == r && j == t;
          var O = -1, W = !0, X = n & D ? new We() : i;
          for (h.set(t, r), h.set(r, t); ++O < m; ) {
            var G = t[O], J = r[O];
            if (l)
              var V = g ? l(J, G, O, r, t, h) : l(G, J, O, t, r, h);
            if (V !== i) {
              if (V)
                continue;
              W = !1;
              break;
            }
            if (X) {
              if (!Vo(r, function(et, ut) {
                if (!Mn(X, ut) && (G === et || a(G, et, n, l, h)))
                  return X.push(ut);
              })) {
                W = !1;
                break;
              }
            } else if (!(G === J || a(G, J, n, l, h))) {
              W = !1;
              break;
            }
          }
          return h.delete(t), h.delete(r), W;
        }
        function Pg(t, r, n, l, a, h, g) {
          switch (n) {
            case tn:
              if (t.byteLength != r.byteLength || t.byteOffset != r.byteOffset)
                return !1;
              t = t.buffer, r = r.buffer;
            case Hn:
              return !(t.byteLength != r.byteLength || !h(new zi(t), new zi(r)));
            case zn:
            case Pn:
            case En:
              return Fr(+t, +r);
            case vi:
              return t.name == r.name && t.message == r.message;
            case jn:
            case An:
              return t == r + "";
            case Tr:
              var m = rl;
            case Nr:
              var _ = l & k;
              if (m || (m = _i), t.size != r.size && !_)
                return !1;
              var P = g.get(t);
              if (P)
                return P == r;
              l |= D, g.set(t, r);
              var j = Is(m(t), m(r), l, a, h, g);
              return g.delete(t), j;
            case gi:
              if (Tn)
                return Tn.call(t) == Tn.call(r);
          }
          return !1;
        }
        function Eg(t, r, n, l, a, h) {
          var g = n & k, m = Sl(t), _ = m.length, P = Sl(r), j = P.length;
          if (_ != j && !g)
            return !1;
          for (var O = _; O--; ) {
            var W = m[O];
            if (!(g ? W in r : wt.call(r, W)))
              return !1;
          }
          var X = h.get(t), G = h.get(r);
          if (X && G)
            return X == r && G == t;
          var J = !0;
          h.set(t, r), h.set(r, t);
          for (var V = g; ++O < _; ) {
            W = m[O];
            var et = t[W], ut = r[W];
            if (l)
              var yr = g ? l(ut, et, W, r, t, h) : l(et, ut, W, t, r, h);
            if (!(yr === i ? et === ut || a(et, ut, n, l, h) : yr)) {
              J = !1;
              break;
            }
            V || (V = W == "constructor");
          }
          if (J && !V) {
            var er = t.constructor, br = r.constructor;
            er != br && "constructor" in t && "constructor" in r && !(typeof er == "function" && er instanceof er && typeof br == "function" && br instanceof br) && (J = !1);
          }
          return h.delete(t), h.delete(r), J;
        }
        function ue(t) {
          return Ml(qs(t, i, Zs), t + "");
        }
        function Sl(t) {
          return es(t, Ft, jl);
        }
        function zl(t) {
          return es(t, ur, Ws);
        }
        var Pl = Hi ? function(t) {
          return Hi.get(t);
        } : Kl;
        function Ki(t) {
          for (var r = t.name + "", n = sn[r], l = wt.call(sn, r) ? n.length : 0; l--; ) {
            var a = n[l], h = a.func;
            if (h == null || h == t)
              return a.name;
          }
          return r;
        }
        function vn(t) {
          var r = wt.call(f, "placeholder") ? f : t;
          return r.placeholder;
        }
        function K() {
          var t = f.iteratee || Ul;
          return t = t === Ul ? os : t, arguments.length ? t(arguments[0], arguments[1]) : t;
        }
        function Gi(t, r) {
          var n = t.__data__;
          return Wg(r) ? n[typeof r == "string" ? "string" : "hash"] : n.map;
        }
        function El(t) {
          for (var r = Ft(t), n = r.length; n--; ) {
            var l = r[n], a = t[l];
            r[n] = [l, a, Ns(a)];
          }
          return r;
        }
        function Ne(t, r) {
          var n = Nv(t, r);
          return is(n) ? n : i;
        }
        function jg(t) {
          var r = wt.call(t, De), n = t[De];
          try {
            t[De] = i;
            var l = !0;
          } catch {
          }
          var a = ki.call(t);
          return l && (r ? t[De] = n : delete t[De]), a;
        }
        var jl = nl ? function(t) {
          return t == null ? [] : (t = _t(t), me(nl(t), function(r) {
            return Fa.call(t, r);
          }));
        } : Gl, Ws = nl ? function(t) {
          for (var r = []; t; )
            we(r, jl(t)), t = Pi(t);
          return r;
        } : Gl, Vt = tr;
        (il && Vt(new il(new ArrayBuffer(1))) != tn || In && Vt(new In()) != Tr || ol && Vt(ol.resolve()) != Ju || an && Vt(new an()) != Nr || Wn && Vt(new Wn()) != On) && (Vt = function(t) {
          var r = tr(t), n = r == ee ? t.constructor : i, l = n ? $e(n) : "";
          if (l)
            switch (l) {
              case hd:
                return tn;
              case vd:
                return Tr;
              case dd:
                return Ju;
              case gd:
                return Nr;
              case pd:
                return On;
            }
          return r;
        });
        function Ag(t, r, n) {
          for (var l = -1, a = n.length; ++l < a; ) {
            var h = n[l], g = h.size;
            switch (h.type) {
              case "drop":
                t += g;
                break;
              case "dropRight":
                r -= g;
                break;
              case "take":
                r = Gt(r, t + g);
                break;
              case "takeRight":
                t = $t(t, r - g);
                break;
            }
          }
          return { start: t, end: r };
        }
        function Og(t) {
          var r = t.match(Lh);
          return r ? r[1].split(Th) : [];
        }
        function Ls(t, r, n) {
          r = Re(r, t);
          for (var l = -1, a = r.length, h = !1; ++l < a; ) {
            var g = Yr(r[l]);
            if (!(h = t != null && n(t, g)))
              break;
            t = t[g];
          }
          return h || ++l != a ? h : (a = t == null ? 0 : t.length, !!a && ro(a) && ae(g, a) && (Z(t) || qe(t)));
        }
        function Hg(t) {
          var r = t.length, n = new t.constructor(r);
          return r && typeof t[0] == "string" && wt.call(t, "index") && (n.index = t.index, n.input = t.input), n;
        }
        function Ts(t) {
          return typeof t.constructor == "function" && !Xn(t) ? cn(Pi(t)) : {};
        }
        function Mg(t, r, n) {
          var l = t.constructor;
          switch (r) {
            case Hn:
              return Rl(t);
            case zn:
            case Pn:
              return new l(+t);
            case tn:
              return mg(t, n);
            case Eo:
            case jo:
            case Ao:
            case Oo:
            case Ho:
            case Mo:
            case Do:
            case Io:
            case Wo:
              return _s(t, n);
            case Tr:
              return new l();
            case En:
            case An:
              return new l(t);
            case jn:
              return wg(t);
            case Nr:
              return new l();
            case gi:
              return yg(t);
          }
        }
        function Dg(t, r) {
          var n = r.length;
          if (!n)
            return t;
          var l = n - 1;
          return r[l] = (n > 1 ? "& " : "") + r[l], r = r.join(n > 2 ? ", " : " "), t.replace(Wh, `{
/* [wrapped with ` + r + `] */
`);
        }
        function Ig(t) {
          return Z(t) || qe(t) || !!(Ba && t && t[Ba]);
        }
        function ae(t, r) {
          var n = typeof t;
          return r = r ?? ir, !!r && (n == "number" || n != "symbol" && Gh.test(t)) && t > -1 && t % 1 == 0 && t < r;
        }
        function rr(t, r, n) {
          if (!zt(n))
            return !1;
          var l = typeof r;
          return (l == "number" ? lr(n) && ae(r, n.length) : l == "string" && r in n) ? Fr(n[r], t) : !1;
        }
        function Al(t, r) {
          if (Z(t))
            return !1;
          var n = typeof t;
          return n == "number" || n == "symbol" || n == "boolean" || t == null || wr(t) ? !0 : Hh.test(t) || !Oh.test(t) || r != null && t in _t(r);
        }
        function Wg(t) {
          var r = typeof t;
          return r == "string" || r == "number" || r == "symbol" || r == "boolean" ? t !== "__proto__" : t === null;
        }
        function Ol(t) {
          var r = Ki(t), n = f[r];
          if (typeof n != "function" || !(r in ot.prototype))
            return !1;
          if (t === n)
            return !0;
          var l = Pl(n);
          return !!l && t === l[0];
        }
        function Lg(t) {
          return !!Na && Na in t;
        }
        var Tg = Ri ? se : Vl;
        function Xn(t) {
          var r = t && t.constructor, n = typeof r == "function" && r.prototype || un;
          return t === n;
        }
        function Ns(t) {
          return t === t && !zt(t);
        }
        function $s(t, r) {
          return function(n) {
            return n == null ? !1 : n[t] === r && (r !== i || t in _t(n));
          };
        }
        function Ng(t) {
          var r = Ji(t, function(l) {
            return n.size === y && n.clear(), l;
          }), n = r.cache;
          return r;
        }
        function $g(t, r) {
          var n = t[1], l = r[1], a = n | l, h = a < (H | L | T), g = l == T && n == U || l == T && n == ct && t[7].length <= r[8] || l == (T | ct) && r[7].length <= r[8] && n == U;
          if (!(h || g))
            return t;
          l & H && (t[2] = r[2], a |= n & H ? 0 : I);
          var m = r[3];
          if (m) {
            var _ = t[3];
            t[3] = _ ? Rs(_, m, r[4]) : m, t[4] = _ ? ye(t[3], x) : r[4];
          }
          return m = r[5], m && (_ = t[5], t[5] = _ ? Cs(_, m, r[6]) : m, t[6] = _ ? ye(t[5], x) : r[6]), m = r[7], m && (t[7] = m), l & T && (t[8] = t[8] == null ? r[8] : Gt(t[8], r[8])), t[9] == null && (t[9] = r[9]), t[0] = r[0], t[1] = a, t;
        }
        function qg(t) {
          var r = [];
          if (t != null)
            for (var n in _t(t))
              r.push(n);
          return r;
        }
        function Fg(t) {
          return ki.call(t);
        }
        function qs(t, r, n) {
          return r = $t(r === i ? t.length - 1 : r, 0), function() {
            for (var l = arguments, a = -1, h = $t(l.length - r, 0), g = R(h); ++a < h; )
              g[a] = l[r + a];
            a = -1;
            for (var m = R(r + 1); ++a < r; )
              m[a] = l[a];
            return m[r] = n(g), gr(t, this, m);
          };
        }
        function Fs(t, r) {
          return r.length < 2 ? t : Te(t, jr(r, 0, -1));
        }
        function Bg(t, r) {
          for (var n = t.length, l = Gt(r.length, n), a = or(t); l--; ) {
            var h = r[l];
            t[l] = ae(h, n) ? a[h] : i;
          }
          return t;
        }
        function Hl(t, r) {
          if (!(r === "constructor" && typeof t[r] == "function") && r != "__proto__")
            return t[r];
        }
        var Bs = Xs(vs), Kn = od || function(t, r) {
          return Ut.setTimeout(t, r);
        }, Ml = Xs(vg);
        function Us(t, r, n) {
          var l = r + "";
          return Ml(t, Dg(l, Ug(Og(l), n)));
        }
        function Xs(t) {
          var r = 0, n = 0;
          return function() {
            var l = sd(), a = at - (l - n);
            if (n = l, a > 0) {
              if (++r >= Et)
                return arguments[0];
            } else
              r = 0;
            return t.apply(i, arguments);
          };
        }
        function Vi(t, r) {
          var n = -1, l = t.length, a = l - 1;
          for (r = r === i ? l : r; ++n < r; ) {
            var h = pl(n, a), g = t[h];
            t[h] = t[n], t[n] = g;
          }
          return t.length = r, t;
        }
        var Ks = Ng(function(t) {
          var r = [];
          return t.charCodeAt(0) === 46 && r.push(""), t.replace(Mh, function(n, l, a, h) {
            r.push(a ? h.replace(qh, "$1") : l || n);
          }), r;
        });
        function Yr(t) {
          if (typeof t == "string" || wr(t))
            return t;
          var r = t + "";
          return r == "0" && 1 / t == -qt ? "-0" : r;
        }
        function $e(t) {
          if (t != null) {
            try {
              return Ci.call(t);
            } catch {
            }
            try {
              return t + "";
            } catch {
            }
          }
          return "";
        }
        function Ug(t, r) {
          return Sr(Po, function(n) {
            var l = "_." + n[0];
            r & n[1] && !yi(t, l) && t.push(l);
          }), t.sort();
        }
        function Gs(t) {
          if (t instanceof ot)
            return t.clone();
          var r = new Pr(t.__wrapped__, t.__chain__);
          return r.__actions__ = or(t.__actions__), r.__index__ = t.__index__, r.__values__ = t.__values__, r;
        }
        function Xg(t, r, n) {
          (n ? rr(t, r, n) : r === i) ? r = 1 : r = $t(Q(r), 0);
          var l = t == null ? 0 : t.length;
          if (!l || r < 1)
            return [];
          for (var a = 0, h = 0, g = R(Ai(l / r)); a < l; )
            g[h++] = jr(t, a, a += r);
          return g;
        }
        function Kg(t) {
          for (var r = -1, n = t == null ? 0 : t.length, l = 0, a = []; ++r < n; ) {
            var h = t[r];
            h && (a[l++] = h);
          }
          return a;
        }
        function Gg() {
          var t = arguments.length;
          if (!t)
            return [];
          for (var r = R(t - 1), n = arguments[0], l = t; l--; )
            r[l - 1] = arguments[l];
          return we(Z(n) ? or(n) : [n], Xt(r, 1));
        }
        var Vg = tt(function(t, r) {
          return Ht(t) ? $n(t, Xt(r, 1, Ht, !0)) : [];
        }), Yg = tt(function(t, r) {
          var n = Ar(r);
          return Ht(n) && (n = i), Ht(t) ? $n(t, Xt(r, 1, Ht, !0), K(n, 2)) : [];
        }), Zg = tt(function(t, r) {
          var n = Ar(r);
          return Ht(n) && (n = i), Ht(t) ? $n(t, Xt(r, 1, Ht, !0), i, n) : [];
        });
        function Qg(t, r, n) {
          var l = t == null ? 0 : t.length;
          return l ? (r = n || r === i ? 1 : Q(r), jr(t, r < 0 ? 0 : r, l)) : [];
        }
        function Jg(t, r, n) {
          var l = t == null ? 0 : t.length;
          return l ? (r = n || r === i ? 1 : Q(r), r = l - r, jr(t, 0, r < 0 ? 0 : r)) : [];
        }
        function tp(t, r) {
          return t && t.length ? $i(t, K(r, 3), !0, !0) : [];
        }
        function rp(t, r) {
          return t && t.length ? $i(t, K(r, 3), !0) : [];
        }
        function ep(t, r, n, l) {
          var a = t == null ? 0 : t.length;
          return a ? (n && typeof n != "number" && rr(t, r, n) && (n = 0, l = a), Gd(t, r, n, l)) : [];
        }
        function Vs(t, r, n) {
          var l = t == null ? 0 : t.length;
          if (!l)
            return -1;
          var a = n == null ? 0 : Q(n);
          return a < 0 && (a = $t(l + a, 0)), bi(t, K(r, 3), a);
        }
        function Ys(t, r, n) {
          var l = t == null ? 0 : t.length;
          if (!l)
            return -1;
          var a = l - 1;
          return n !== i && (a = Q(n), a = n < 0 ? $t(l + a, 0) : Gt(a, l - 1)), bi(t, K(r, 3), a, !0);
        }
        function Zs(t) {
          var r = t == null ? 0 : t.length;
          return r ? Xt(t, 1) : [];
        }
        function np(t) {
          var r = t == null ? 0 : t.length;
          return r ? Xt(t, qt) : [];
        }
        function ip(t, r) {
          var n = t == null ? 0 : t.length;
          return n ? (r = r === i ? 1 : Q(r), Xt(t, r)) : [];
        }
        function op(t) {
          for (var r = -1, n = t == null ? 0 : t.length, l = {}; ++r < n; ) {
            var a = t[r];
            l[a[0]] = a[1];
          }
          return l;
        }
        function Qs(t) {
          return t && t.length ? t[0] : i;
        }
        function lp(t, r, n) {
          var l = t == null ? 0 : t.length;
          if (!l)
            return -1;
          var a = n == null ? 0 : Q(n);
          return a < 0 && (a = $t(l + a, 0)), en(t, r, a);
        }
        function up(t) {
          var r = t == null ? 0 : t.length;
          return r ? jr(t, 0, -1) : [];
        }
        var ap = tt(function(t) {
          var r = St(t, _l);
          return r.length && r[0] === t[0] ? fl(r) : [];
        }), sp = tt(function(t) {
          var r = Ar(t), n = St(t, _l);
          return r === Ar(n) ? r = i : n.pop(), n.length && n[0] === t[0] ? fl(n, K(r, 2)) : [];
        }), cp = tt(function(t) {
          var r = Ar(t), n = St(t, _l);
          return r = typeof r == "function" ? r : i, r && n.pop(), n.length && n[0] === t[0] ? fl(n, i, r) : [];
        });
        function fp(t, r) {
          return t == null ? "" : ud.call(t, r);
        }
        function Ar(t) {
          var r = t == null ? 0 : t.length;
          return r ? t[r - 1] : i;
        }
        function hp(t, r, n) {
          var l = t == null ? 0 : t.length;
          if (!l)
            return -1;
          var a = l;
          return n !== i && (a = Q(n), a = a < 0 ? $t(l + a, 0) : Gt(a, l - 1)), r === r ? Uv(t, r, a) : bi(t, Oa, a, !0);
        }
        function vp(t, r) {
          return t && t.length ? ss(t, Q(r)) : i;
        }
        var dp = tt(Js);
        function Js(t, r) {
          return t && t.length && r && r.length ? gl(t, r) : t;
        }
        function gp(t, r, n) {
          return t && t.length && r && r.length ? gl(t, r, K(n, 2)) : t;
        }
        function pp(t, r, n) {
          return t && t.length && r && r.length ? gl(t, r, i, n) : t;
        }
        var mp = ue(function(t, r) {
          var n = t == null ? 0 : t.length, l = ul(t, r);
          return hs(t, St(r, function(a) {
            return ae(a, n) ? +a : a;
          }).sort(xs)), l;
        });
        function wp(t, r) {
          var n = [];
          if (!(t && t.length))
            return n;
          var l = -1, a = [], h = t.length;
          for (r = K(r, 3); ++l < h; ) {
            var g = t[l];
            r(g, l, t) && (n.push(g), a.push(l));
          }
          return hs(t, a), n;
        }
        function Dl(t) {
          return t == null ? t : fd.call(t);
        }
        function yp(t, r, n) {
          var l = t == null ? 0 : t.length;
          return l ? (n && typeof n != "number" && rr(t, r, n) ? (r = 0, n = l) : (r = r == null ? 0 : Q(r), n = n === i ? l : Q(n)), jr(t, r, n)) : [];
        }
        function bp(t, r) {
          return Ni(t, r);
        }
        function _p(t, r, n) {
          return wl(t, r, K(n, 2));
        }
        function xp(t, r) {
          var n = t == null ? 0 : t.length;
          if (n) {
            var l = Ni(t, r);
            if (l < n && Fr(t[l], r))
              return l;
          }
          return -1;
        }
        function Rp(t, r) {
          return Ni(t, r, !0);
        }
        function Cp(t, r, n) {
          return wl(t, r, K(n, 2), !0);
        }
        function kp(t, r) {
          var n = t == null ? 0 : t.length;
          if (n) {
            var l = Ni(t, r, !0) - 1;
            if (Fr(t[l], r))
              return l;
          }
          return -1;
        }
        function Sp(t) {
          return t && t.length ? ds(t) : [];
        }
        function zp(t, r) {
          return t && t.length ? ds(t, K(r, 2)) : [];
        }
        function Pp(t) {
          var r = t == null ? 0 : t.length;
          return r ? jr(t, 1, r) : [];
        }
        function Ep(t, r, n) {
          return t && t.length ? (r = n || r === i ? 1 : Q(r), jr(t, 0, r < 0 ? 0 : r)) : [];
        }
        function jp(t, r, n) {
          var l = t == null ? 0 : t.length;
          return l ? (r = n || r === i ? 1 : Q(r), r = l - r, jr(t, r < 0 ? 0 : r, l)) : [];
        }
        function Ap(t, r) {
          return t && t.length ? $i(t, K(r, 3), !1, !0) : [];
        }
        function Op(t, r) {
          return t && t.length ? $i(t, K(r, 3)) : [];
        }
        var Hp = tt(function(t) {
          return xe(Xt(t, 1, Ht, !0));
        }), Mp = tt(function(t) {
          var r = Ar(t);
          return Ht(r) && (r = i), xe(Xt(t, 1, Ht, !0), K(r, 2));
        }), Dp = tt(function(t) {
          var r = Ar(t);
          return r = typeof r == "function" ? r : i, xe(Xt(t, 1, Ht, !0), i, r);
        });
        function Ip(t) {
          return t && t.length ? xe(t) : [];
        }
        function Wp(t, r) {
          return t && t.length ? xe(t, K(r, 2)) : [];
        }
        function Lp(t, r) {
          return r = typeof r == "function" ? r : i, t && t.length ? xe(t, i, r) : [];
        }
        function Il(t) {
          if (!(t && t.length))
            return [];
          var r = 0;
          return t = me(t, function(n) {
            if (Ht(n))
              return r = $t(n.length, r), !0;
          }), Jo(r, function(n) {
            return St(t, Yo(n));
          });
        }
        function tc(t, r) {
          if (!(t && t.length))
            return [];
          var n = Il(t);
          return r == null ? n : St(n, function(l) {
            return gr(r, i, l);
          });
        }
        var Tp = tt(function(t, r) {
          return Ht(t) ? $n(t, r) : [];
        }), Np = tt(function(t) {
          return bl(me(t, Ht));
        }), $p = tt(function(t) {
          var r = Ar(t);
          return Ht(r) && (r = i), bl(me(t, Ht), K(r, 2));
        }), qp = tt(function(t) {
          var r = Ar(t);
          return r = typeof r == "function" ? r : i, bl(me(t, Ht), i, r);
        }), Fp = tt(Il);
        function Bp(t, r) {
          return ws(t || [], r || [], Nn);
        }
        function Up(t, r) {
          return ws(t || [], r || [], Bn);
        }
        var Xp = tt(function(t) {
          var r = t.length, n = r > 1 ? t[r - 1] : i;
          return n = typeof n == "function" ? (t.pop(), n) : i, tc(t, n);
        });
        function rc(t) {
          var r = f(t);
          return r.__chain__ = !0, r;
        }
        function Kp(t, r) {
          return r(t), t;
        }
        function Yi(t, r) {
          return r(t);
        }
        var Gp = ue(function(t) {
          var r = t.length, n = r ? t[0] : 0, l = this.__wrapped__, a = function(h) {
            return ul(h, t);
          };
          return r > 1 || this.__actions__.length || !(l instanceof ot) || !ae(n) ? this.thru(a) : (l = l.slice(n, +n + (r ? 1 : 0)), l.__actions__.push({
            func: Yi,
            args: [a],
            thisArg: i
          }), new Pr(l, this.__chain__).thru(function(h) {
            return r && !h.length && h.push(i), h;
          }));
        });
        function Vp() {
          return rc(this);
        }
        function Yp() {
          return new Pr(this.value(), this.__chain__);
        }
        function Zp() {
          this.__values__ === i && (this.__values__ = gc(this.value()));
          var t = this.__index__ >= this.__values__.length, r = t ? i : this.__values__[this.__index__++];
          return { done: t, value: r };
        }
        function Qp() {
          return this;
        }
        function Jp(t) {
          for (var r, n = this; n instanceof Di; ) {
            var l = Gs(n);
            l.__index__ = 0, l.__values__ = i, r ? a.__wrapped__ = l : r = l;
            var a = l;
            n = n.__wrapped__;
          }
          return a.__wrapped__ = t, r;
        }
        function t0() {
          var t = this.__wrapped__;
          if (t instanceof ot) {
            var r = t;
            return this.__actions__.length && (r = new ot(this)), r = r.reverse(), r.__actions__.push({
              func: Yi,
              args: [Dl],
              thisArg: i
            }), new Pr(r, this.__chain__);
          }
          return this.thru(Dl);
        }
        function r0() {
          return ms(this.__wrapped__, this.__actions__);
        }
        var e0 = qi(function(t, r, n) {
          wt.call(t, n) ? ++t[n] : oe(t, n, 1);
        });
        function n0(t, r, n) {
          var l = Z(t) ? ja : Kd;
          return n && rr(t, r, n) && (r = i), l(t, K(r, 3));
        }
        function i0(t, r) {
          var n = Z(t) ? me : ts;
          return n(t, K(r, 3));
        }
        var o0 = Ps(Vs), l0 = Ps(Ys);
        function u0(t, r) {
          return Xt(Zi(t, r), 1);
        }
        function a0(t, r) {
          return Xt(Zi(t, r), qt);
        }
        function s0(t, r, n) {
          return n = n === i ? 1 : Q(n), Xt(Zi(t, r), n);
        }
        function ec(t, r) {
          var n = Z(t) ? Sr : _e;
          return n(t, K(r, 3));
        }
        function nc(t, r) {
          var n = Z(t) ? Pv : Ja;
          return n(t, K(r, 3));
        }
        var c0 = qi(function(t, r, n) {
          wt.call(t, n) ? t[n].push(r) : oe(t, n, [r]);
        });
        function f0(t, r, n, l) {
          t = lr(t) ? t : gn(t), n = n && !l ? Q(n) : 0;
          var a = t.length;
          return n < 0 && (n = $t(a + n, 0)), eo(t) ? n <= a && t.indexOf(r, n) > -1 : !!a && en(t, r, n) > -1;
        }
        var h0 = tt(function(t, r, n) {
          var l = -1, a = typeof r == "function", h = lr(t) ? R(t.length) : [];
          return _e(t, function(g) {
            h[++l] = a ? gr(r, g, n) : qn(g, r, n);
          }), h;
        }), v0 = qi(function(t, r, n) {
          oe(t, n, r);
        });
        function Zi(t, r) {
          var n = Z(t) ? St : ls;
          return n(t, K(r, 3));
        }
        function d0(t, r, n, l) {
          return t == null ? [] : (Z(r) || (r = r == null ? [] : [r]), n = l ? i : n, Z(n) || (n = n == null ? [] : [n]), cs(t, r, n));
        }
        var g0 = qi(function(t, r, n) {
          t[n ? 0 : 1].push(r);
        }, function() {
          return [[], []];
        });
        function p0(t, r, n) {
          var l = Z(t) ? Go : Ma, a = arguments.length < 3;
          return l(t, K(r, 4), n, a, _e);
        }
        function m0(t, r, n) {
          var l = Z(t) ? Ev : Ma, a = arguments.length < 3;
          return l(t, K(r, 4), n, a, Ja);
        }
        function w0(t, r) {
          var n = Z(t) ? me : ts;
          return n(t, to(K(r, 3)));
        }
        function y0(t) {
          var r = Z(t) ? Va : fg;
          return r(t);
        }
        function b0(t, r, n) {
          (n ? rr(t, r, n) : r === i) ? r = 1 : r = Q(r);
          var l = Z(t) ? qd : hg;
          return l(t, r);
        }
        function _0(t) {
          var r = Z(t) ? Fd : dg;
          return r(t);
        }
        function x0(t) {
          if (t == null)
            return 0;
          if (lr(t))
            return eo(t) ? on(t) : t.length;
          var r = Vt(t);
          return r == Tr || r == Nr ? t.size : vl(t).length;
        }
        function R0(t, r, n) {
          var l = Z(t) ? Vo : gg;
          return n && rr(t, r, n) && (r = i), l(t, K(r, 3));
        }
        var C0 = tt(function(t, r) {
          if (t == null)
            return [];
          var n = r.length;
          return n > 1 && rr(t, r[0], r[1]) ? r = [] : n > 2 && rr(r[0], r[1], r[2]) && (r = [r[0]]), cs(t, Xt(r, 1), []);
        }), Qi = id || function() {
          return Ut.Date.now();
        };
        function k0(t, r) {
          if (typeof r != "function")
            throw new zr(v);
          return t = Q(t), function() {
            if (--t < 1)
              return r.apply(this, arguments);
          };
        }
        function ic(t, r, n) {
          return r = n ? i : r, r = t && r == null ? t.length : r, le(t, T, i, i, i, i, r);
        }
        function oc(t, r) {
          var n;
          if (typeof r != "function")
            throw new zr(v);
          return t = Q(t), function() {
            return --t > 0 && (n = r.apply(this, arguments)), t <= 1 && (r = i), n;
          };
        }
        var Wl = tt(function(t, r, n) {
          var l = H;
          if (n.length) {
            var a = ye(n, vn(Wl));
            l |= N;
          }
          return le(t, l, r, n, a);
        }), lc = tt(function(t, r, n) {
          var l = H | L;
          if (n.length) {
            var a = ye(n, vn(lc));
            l |= N;
          }
          return le(r, l, t, n, a);
        });
        function uc(t, r, n) {
          r = n ? i : r;
          var l = le(t, U, i, i, i, i, i, r);
          return l.placeholder = uc.placeholder, l;
        }
        function ac(t, r, n) {
          r = n ? i : r;
          var l = le(t, q, i, i, i, i, i, r);
          return l.placeholder = ac.placeholder, l;
        }
        function sc(t, r, n) {
          var l, a, h, g, m, _, P = 0, j = !1, O = !1, W = !0;
          if (typeof t != "function")
            throw new zr(v);
          r = Or(r) || 0, zt(n) && (j = !!n.leading, O = "maxWait" in n, h = O ? $t(Or(n.maxWait) || 0, r) : h, W = "trailing" in n ? !!n.trailing : W);
          function X(Mt) {
            var Br = l, fe = a;
            return l = a = i, P = Mt, g = t.apply(fe, Br), g;
          }
          function G(Mt) {
            return P = Mt, m = Kn(et, r), j ? X(Mt) : g;
          }
          function J(Mt) {
            var Br = Mt - _, fe = Mt - P, Pc = r - Br;
            return O ? Gt(Pc, h - fe) : Pc;
          }
          function V(Mt) {
            var Br = Mt - _, fe = Mt - P;
            return _ === i || Br >= r || Br < 0 || O && fe >= h;
          }
          function et() {
            var Mt = Qi();
            if (V(Mt))
              return ut(Mt);
            m = Kn(et, J(Mt));
          }
          function ut(Mt) {
            return m = i, W && l ? X(Mt) : (l = a = i, g);
          }
          function yr() {
            m !== i && ys(m), P = 0, l = _ = a = m = i;
          }
          function er() {
            return m === i ? g : ut(Qi());
          }
          function br() {
            var Mt = Qi(), Br = V(Mt);
            if (l = arguments, a = this, _ = Mt, Br) {
              if (m === i)
                return G(_);
              if (O)
                return ys(m), m = Kn(et, r), X(_);
            }
            return m === i && (m = Kn(et, r)), g;
          }
          return br.cancel = yr, br.flush = er, br;
        }
        var S0 = tt(function(t, r) {
          return Qa(t, 1, r);
        }), z0 = tt(function(t, r, n) {
          return Qa(t, Or(r) || 0, n);
        });
        function P0(t) {
          return le(t, it);
        }
        function Ji(t, r) {
          if (typeof t != "function" || r != null && typeof r != "function")
            throw new zr(v);
          var n = function() {
            var l = arguments, a = r ? r.apply(this, l) : l[0], h = n.cache;
            if (h.has(a))
              return h.get(a);
            var g = t.apply(this, l);
            return n.cache = h.set(a, g) || h, g;
          };
          return n.cache = new (Ji.Cache || ie)(), n;
        }
        Ji.Cache = ie;
        function to(t) {
          if (typeof t != "function")
            throw new zr(v);
          return function() {
            var r = arguments;
            switch (r.length) {
              case 0:
                return !t.call(this);
              case 1:
                return !t.call(this, r[0]);
              case 2:
                return !t.call(this, r[0], r[1]);
              case 3:
                return !t.call(this, r[0], r[1], r[2]);
            }
            return !t.apply(this, r);
          };
        }
        function E0(t) {
          return oc(2, t);
        }
        var j0 = pg(function(t, r) {
          r = r.length == 1 && Z(r[0]) ? St(r[0], pr(K())) : St(Xt(r, 1), pr(K()));
          var n = r.length;
          return tt(function(l) {
            for (var a = -1, h = Gt(l.length, n); ++a < h; )
              l[a] = r[a].call(this, l[a]);
            return gr(t, this, l);
          });
        }), Ll = tt(function(t, r) {
          var n = ye(r, vn(Ll));
          return le(t, N, i, r, n);
        }), cc = tt(function(t, r) {
          var n = ye(r, vn(cc));
          return le(t, B, i, r, n);
        }), A0 = ue(function(t, r) {
          return le(t, ct, i, i, i, r);
        });
        function O0(t, r) {
          if (typeof t != "function")
            throw new zr(v);
          return r = r === i ? r : Q(r), tt(t, r);
        }
        function H0(t, r) {
          if (typeof t != "function")
            throw new zr(v);
          return r = r == null ? 0 : $t(Q(r), 0), tt(function(n) {
            var l = n[r], a = Ce(n, 0, r);
            return l && we(a, l), gr(t, this, a);
          });
        }
        function M0(t, r, n) {
          var l = !0, a = !0;
          if (typeof t != "function")
            throw new zr(v);
          return zt(n) && (l = "leading" in n ? !!n.leading : l, a = "trailing" in n ? !!n.trailing : a), sc(t, r, {
            leading: l,
            maxWait: r,
            trailing: a
          });
        }
        function D0(t) {
          return ic(t, 1);
        }
        function I0(t, r) {
          return Ll(xl(r), t);
        }
        function W0() {
          if (!arguments.length)
            return [];
          var t = arguments[0];
          return Z(t) ? t : [t];
        }
        function L0(t) {
          return Er(t, E);
        }
        function T0(t, r) {
          return r = typeof r == "function" ? r : i, Er(t, E, r);
        }
        function N0(t) {
          return Er(t, S | E);
        }
        function $0(t, r) {
          return r = typeof r == "function" ? r : i, Er(t, S | E, r);
        }
        function q0(t, r) {
          return r == null || Za(t, r, Ft(r));
        }
        function Fr(t, r) {
          return t === r || t !== t && r !== r;
        }
        var F0 = Xi(cl), B0 = Xi(function(t, r) {
          return t >= r;
        }), qe = ns(/* @__PURE__ */ function() {
          return arguments;
        }()) ? ns : function(t) {
          return jt(t) && wt.call(t, "callee") && !Fa.call(t, "callee");
        }, Z = R.isArray, U0 = Ca ? pr(Ca) : Jd;
        function lr(t) {
          return t != null && ro(t.length) && !se(t);
        }
        function Ht(t) {
          return jt(t) && lr(t);
        }
        function X0(t) {
          return t === !0 || t === !1 || jt(t) && tr(t) == zn;
        }
        var ke = ld || Vl, K0 = ka ? pr(ka) : tg;
        function G0(t) {
          return jt(t) && t.nodeType === 1 && !Gn(t);
        }
        function V0(t) {
          if (t == null)
            return !0;
          if (lr(t) && (Z(t) || typeof t == "string" || typeof t.splice == "function" || ke(t) || dn(t) || qe(t)))
            return !t.length;
          var r = Vt(t);
          if (r == Tr || r == Nr)
            return !t.size;
          if (Xn(t))
            return !vl(t).length;
          for (var n in t)
            if (wt.call(t, n))
              return !1;
          return !0;
        }
        function Y0(t, r) {
          return Fn(t, r);
        }
        function Z0(t, r, n) {
          n = typeof n == "function" ? n : i;
          var l = n ? n(t, r) : i;
          return l === i ? Fn(t, r, i, n) : !!l;
        }
        function Tl(t) {
          if (!jt(t))
            return !1;
          var r = tr(t);
          return r == vi || r == bh || typeof t.message == "string" && typeof t.name == "string" && !Gn(t);
        }
        function Q0(t) {
          return typeof t == "number" && Ua(t);
        }
        function se(t) {
          if (!zt(t))
            return !1;
          var r = tr(t);
          return r == di || r == Qu || r == yh || r == xh;
        }
        function fc(t) {
          return typeof t == "number" && t == Q(t);
        }
        function ro(t) {
          return typeof t == "number" && t > -1 && t % 1 == 0 && t <= ir;
        }
        function zt(t) {
          var r = typeof t;
          return t != null && (r == "object" || r == "function");
        }
        function jt(t) {
          return t != null && typeof t == "object";
        }
        var hc = Sa ? pr(Sa) : eg;
        function J0(t, r) {
          return t === r || hl(t, r, El(r));
        }
        function tm(t, r, n) {
          return n = typeof n == "function" ? n : i, hl(t, r, El(r), n);
        }
        function rm(t) {
          return vc(t) && t != +t;
        }
        function em(t) {
          if (Tg(t))
            throw new Y(c);
          return is(t);
        }
        function nm(t) {
          return t === null;
        }
        function im(t) {
          return t == null;
        }
        function vc(t) {
          return typeof t == "number" || jt(t) && tr(t) == En;
        }
        function Gn(t) {
          if (!jt(t) || tr(t) != ee)
            return !1;
          var r = Pi(t);
          if (r === null)
            return !0;
          var n = wt.call(r, "constructor") && r.constructor;
          return typeof n == "function" && n instanceof n && Ci.call(n) == td;
        }
        var Nl = za ? pr(za) : ng;
        function om(t) {
          return fc(t) && t >= -ir && t <= ir;
        }
        var dc = Pa ? pr(Pa) : ig;
        function eo(t) {
          return typeof t == "string" || !Z(t) && jt(t) && tr(t) == An;
        }
        function wr(t) {
          return typeof t == "symbol" || jt(t) && tr(t) == gi;
        }
        var dn = Ea ? pr(Ea) : og;
        function lm(t) {
          return t === i;
        }
        function um(t) {
          return jt(t) && Vt(t) == On;
        }
        function am(t) {
          return jt(t) && tr(t) == Ch;
        }
        var sm = Xi(dl), cm = Xi(function(t, r) {
          return t <= r;
        });
        function gc(t) {
          if (!t)
            return [];
          if (lr(t))
            return eo(t) ? $r(t) : or(t);
          if (Dn && t[Dn])
            return qv(t[Dn]());
          var r = Vt(t), n = r == Tr ? rl : r == Nr ? _i : gn;
          return n(t);
        }
        function ce(t) {
          if (!t)
            return t === 0 ? t : 0;
          if (t = Or(t), t === qt || t === -qt) {
            var r = t < 0 ? -1 : 1;
            return r * Kt;
          }
          return t === t ? t : 0;
        }
        function Q(t) {
          var r = ce(t), n = r % 1;
          return r === r ? n ? r - n : r : 0;
        }
        function pc(t) {
          return t ? Le(Q(t), 0, Jt) : 0;
        }
        function Or(t) {
          if (typeof t == "number")
            return t;
          if (wr(t))
            return Cr;
          if (zt(t)) {
            var r = typeof t.valueOf == "function" ? t.valueOf() : t;
            t = zt(r) ? r + "" : r;
          }
          if (typeof t != "string")
            return t === 0 ? t : +t;
          t = Da(t);
          var n = Uh.test(t);
          return n || Kh.test(t) ? kv(t.slice(2), n ? 2 : 8) : Bh.test(t) ? Cr : +t;
        }
        function mc(t) {
          return Vr(t, ur(t));
        }
        function fm(t) {
          return t ? Le(Q(t), -ir, ir) : t === 0 ? t : 0;
        }
        function gt(t) {
          return t == null ? "" : mr(t);
        }
        var hm = fn(function(t, r) {
          if (Xn(r) || lr(r)) {
            Vr(r, Ft(r), t);
            return;
          }
          for (var n in r)
            wt.call(r, n) && Nn(t, n, r[n]);
        }), wc = fn(function(t, r) {
          Vr(r, ur(r), t);
        }), no = fn(function(t, r, n, l) {
          Vr(r, ur(r), t, l);
        }), vm = fn(function(t, r, n, l) {
          Vr(r, Ft(r), t, l);
        }), dm = ue(ul);
        function gm(t, r) {
          var n = cn(t);
          return r == null ? n : Ya(n, r);
        }
        var pm = tt(function(t, r) {
          t = _t(t);
          var n = -1, l = r.length, a = l > 2 ? r[2] : i;
          for (a && rr(r[0], r[1], a) && (l = 1); ++n < l; )
            for (var h = r[n], g = ur(h), m = -1, _ = g.length; ++m < _; ) {
              var P = g[m], j = t[P];
              (j === i || Fr(j, un[P]) && !wt.call(t, P)) && (t[P] = h[P]);
            }
          return t;
        }), mm = tt(function(t) {
          return t.push(i, Ds), gr(yc, i, t);
        });
        function wm(t, r) {
          return Aa(t, K(r, 3), Gr);
        }
        function ym(t, r) {
          return Aa(t, K(r, 3), sl);
        }
        function bm(t, r) {
          return t == null ? t : al(t, K(r, 3), ur);
        }
        function _m(t, r) {
          return t == null ? t : rs(t, K(r, 3), ur);
        }
        function xm(t, r) {
          return t && Gr(t, K(r, 3));
        }
        function Rm(t, r) {
          return t && sl(t, K(r, 3));
        }
        function Cm(t) {
          return t == null ? [] : Li(t, Ft(t));
        }
        function km(t) {
          return t == null ? [] : Li(t, ur(t));
        }
        function $l(t, r, n) {
          var l = t == null ? i : Te(t, r);
          return l === i ? n : l;
        }
        function Sm(t, r) {
          return t != null && Ls(t, r, Vd);
        }
        function ql(t, r) {
          return t != null && Ls(t, r, Yd);
        }
        var zm = js(function(t, r, n) {
          r != null && typeof r.toString != "function" && (r = ki.call(r)), t[r] = n;
        }, Bl(ar)), Pm = js(function(t, r, n) {
          r != null && typeof r.toString != "function" && (r = ki.call(r)), wt.call(t, r) ? t[r].push(n) : t[r] = [n];
        }, K), Em = tt(qn);
        function Ft(t) {
          return lr(t) ? Ga(t) : vl(t);
        }
        function ur(t) {
          return lr(t) ? Ga(t, !0) : lg(t);
        }
        function jm(t, r) {
          var n = {};
          return r = K(r, 3), Gr(t, function(l, a, h) {
            oe(n, r(l, a, h), l);
          }), n;
        }
        function Am(t, r) {
          var n = {};
          return r = K(r, 3), Gr(t, function(l, a, h) {
            oe(n, a, r(l, a, h));
          }), n;
        }
        var Om = fn(function(t, r, n) {
          Ti(t, r, n);
        }), yc = fn(function(t, r, n, l) {
          Ti(t, r, n, l);
        }), Hm = ue(function(t, r) {
          var n = {};
          if (t == null)
            return n;
          var l = !1;
          r = St(r, function(h) {
            return h = Re(h, t), l || (l = h.length > 1), h;
          }), Vr(t, zl(t), n), l && (n = Er(n, S | z | E, zg));
          for (var a = r.length; a--; )
            yl(n, r[a]);
          return n;
        });
        function Mm(t, r) {
          return bc(t, to(K(r)));
        }
        var Dm = ue(function(t, r) {
          return t == null ? {} : ag(t, r);
        });
        function bc(t, r) {
          if (t == null)
            return {};
          var n = St(zl(t), function(l) {
            return [l];
          });
          return r = K(r), fs(t, n, function(l, a) {
            return r(l, a[0]);
          });
        }
        function Im(t, r, n) {
          r = Re(r, t);
          var l = -1, a = r.length;
          for (a || (a = 1, t = i); ++l < a; ) {
            var h = t == null ? i : t[Yr(r[l])];
            h === i && (l = a, h = n), t = se(h) ? h.call(t) : h;
          }
          return t;
        }
        function Wm(t, r, n) {
          return t == null ? t : Bn(t, r, n);
        }
        function Lm(t, r, n, l) {
          return l = typeof l == "function" ? l : i, t == null ? t : Bn(t, r, n, l);
        }
        var _c = Hs(Ft), xc = Hs(ur);
        function Tm(t, r, n) {
          var l = Z(t), a = l || ke(t) || dn(t);
          if (r = K(r, 4), n == null) {
            var h = t && t.constructor;
            a ? n = l ? new h() : [] : zt(t) ? n = se(h) ? cn(Pi(t)) : {} : n = {};
          }
          return (a ? Sr : Gr)(t, function(g, m, _) {
            return r(n, g, m, _);
          }), n;
        }
        function Nm(t, r) {
          return t == null ? !0 : yl(t, r);
        }
        function $m(t, r, n) {
          return t == null ? t : ps(t, r, xl(n));
        }
        function qm(t, r, n, l) {
          return l = typeof l == "function" ? l : i, t == null ? t : ps(t, r, xl(n), l);
        }
        function gn(t) {
          return t == null ? [] : tl(t, Ft(t));
        }
        function Fm(t) {
          return t == null ? [] : tl(t, ur(t));
        }
        function Bm(t, r, n) {
          return n === i && (n = r, r = i), n !== i && (n = Or(n), n = n === n ? n : 0), r !== i && (r = Or(r), r = r === r ? r : 0), Le(Or(t), r, n);
        }
        function Um(t, r, n) {
          return r = ce(r), n === i ? (n = r, r = 0) : n = ce(n), t = Or(t), Zd(t, r, n);
        }
        function Xm(t, r, n) {
          if (n && typeof n != "boolean" && rr(t, r, n) && (r = n = i), n === i && (typeof r == "boolean" ? (n = r, r = i) : typeof t == "boolean" && (n = t, t = i)), t === i && r === i ? (t = 0, r = 1) : (t = ce(t), r === i ? (r = t, t = 0) : r = ce(r)), t > r) {
            var l = t;
            t = r, r = l;
          }
          if (n || t % 1 || r % 1) {
            var a = Xa();
            return Gt(t + a * (r - t + Cv("1e-" + ((a + "").length - 1))), r);
          }
          return pl(t, r);
        }
        var Km = hn(function(t, r, n) {
          return r = r.toLowerCase(), t + (n ? Rc(r) : r);
        });
        function Rc(t) {
          return Fl(gt(t).toLowerCase());
        }
        function Cc(t) {
          return t = gt(t), t && t.replace(Vh, Wv).replace(dv, "");
        }
        function Gm(t, r, n) {
          t = gt(t), r = mr(r);
          var l = t.length;
          n = n === i ? l : Le(Q(n), 0, l);
          var a = n;
          return n -= r.length, n >= 0 && t.slice(n, a) == r;
        }
        function Vm(t) {
          return t = gt(t), t && Eh.test(t) ? t.replace(ra, Lv) : t;
        }
        function Ym(t) {
          return t = gt(t), t && Dh.test(t) ? t.replace(Lo, "\\$&") : t;
        }
        var Zm = hn(function(t, r, n) {
          return t + (n ? "-" : "") + r.toLowerCase();
        }), Qm = hn(function(t, r, n) {
          return t + (n ? " " : "") + r.toLowerCase();
        }), Jm = zs("toLowerCase");
        function tw(t, r, n) {
          t = gt(t), r = Q(r);
          var l = r ? on(t) : 0;
          if (!r || l >= r)
            return t;
          var a = (r - l) / 2;
          return Ui(Oi(a), n) + t + Ui(Ai(a), n);
        }
        function rw(t, r, n) {
          t = gt(t), r = Q(r);
          var l = r ? on(t) : 0;
          return r && l < r ? t + Ui(r - l, n) : t;
        }
        function ew(t, r, n) {
          t = gt(t), r = Q(r);
          var l = r ? on(t) : 0;
          return r && l < r ? Ui(r - l, n) + t : t;
        }
        function nw(t, r, n) {
          return n || r == null ? r = 0 : r && (r = +r), cd(gt(t).replace(To, ""), r || 0);
        }
        function iw(t, r, n) {
          return (n ? rr(t, r, n) : r === i) ? r = 1 : r = Q(r), ml(gt(t), r);
        }
        function ow() {
          var t = arguments, r = gt(t[0]);
          return t.length < 3 ? r : r.replace(t[1], t[2]);
        }
        var lw = hn(function(t, r, n) {
          return t + (n ? "_" : "") + r.toLowerCase();
        });
        function uw(t, r, n) {
          return n && typeof n != "number" && rr(t, r, n) && (r = n = i), n = n === i ? Jt : n >>> 0, n ? (t = gt(t), t && (typeof r == "string" || r != null && !Nl(r)) && (r = mr(r), !r && nn(t)) ? Ce($r(t), 0, n) : t.split(r, n)) : [];
        }
        var aw = hn(function(t, r, n) {
          return t + (n ? " " : "") + Fl(r);
        });
        function sw(t, r, n) {
          return t = gt(t), n = n == null ? 0 : Le(Q(n), 0, t.length), r = mr(r), t.slice(n, n + r.length) == r;
        }
        function cw(t, r, n) {
          var l = f.templateSettings;
          n && rr(t, r, n) && (r = i), t = gt(t), r = no({}, r, l, Ms);
          var a = no({}, r.imports, l.imports, Ms), h = Ft(a), g = tl(a, h), m, _, P = 0, j = r.interpolate || pi, O = "__p += '", W = el(
            (r.escape || pi).source + "|" + j.source + "|" + (j === ea ? Fh : pi).source + "|" + (r.evaluate || pi).source + "|$",
            "g"
          ), X = "//# sourceURL=" + (wt.call(r, "sourceURL") ? (r.sourceURL + "").replace(/\s/g, " ") : "lodash.templateSources[" + ++yv + "]") + `
`;
          t.replace(W, function(V, et, ut, yr, er, br) {
            return ut || (ut = yr), O += t.slice(P, br).replace(Yh, Tv), et && (m = !0, O += `' +
__e(` + et + `) +
'`), er && (_ = !0, O += `';
` + er + `;
__p += '`), ut && (O += `' +
((__t = (` + ut + `)) == null ? '' : __t) +
'`), P = br + V.length, V;
          }), O += `';
`;
          var G = wt.call(r, "variable") && r.variable;
          if (!G)
            O = `with (obj) {
` + O + `
}
`;
          else if ($h.test(G))
            throw new Y(w);
          O = (_ ? O.replace(kh, "") : O).replace(Sh, "$1").replace(zh, "$1;"), O = "function(" + (G || "obj") + `) {
` + (G ? "" : `obj || (obj = {});
`) + "var __t, __p = ''" + (m ? ", __e = _.escape" : "") + (_ ? `, __j = Array.prototype.join;
function print() { __p += __j.call(arguments, '') }
` : `;
`) + O + `return __p
}`;
          var J = Sc(function() {
            return ft(h, X + "return " + O).apply(i, g);
          });
          if (J.source = O, Tl(J))
            throw J;
          return J;
        }
        function fw(t) {
          return gt(t).toLowerCase();
        }
        function hw(t) {
          return gt(t).toUpperCase();
        }
        function vw(t, r, n) {
          if (t = gt(t), t && (n || r === i))
            return Da(t);
          if (!t || !(r = mr(r)))
            return t;
          var l = $r(t), a = $r(r), h = Ia(l, a), g = Wa(l, a) + 1;
          return Ce(l, h, g).join("");
        }
        function dw(t, r, n) {
          if (t = gt(t), t && (n || r === i))
            return t.slice(0, Ta(t) + 1);
          if (!t || !(r = mr(r)))
            return t;
          var l = $r(t), a = Wa(l, $r(r)) + 1;
          return Ce(l, 0, a).join("");
        }
        function gw(t, r, n) {
          if (t = gt(t), t && (n || r === i))
            return t.replace(To, "");
          if (!t || !(r = mr(r)))
            return t;
          var l = $r(t), a = Ia(l, $r(r));
          return Ce(l, a).join("");
        }
        function pw(t, r) {
          var n = kt, l = Tt;
          if (zt(r)) {
            var a = "separator" in r ? r.separator : a;
            n = "length" in r ? Q(r.length) : n, l = "omission" in r ? mr(r.omission) : l;
          }
          t = gt(t);
          var h = t.length;
          if (nn(t)) {
            var g = $r(t);
            h = g.length;
          }
          if (n >= h)
            return t;
          var m = n - on(l);
          if (m < 1)
            return l;
          var _ = g ? Ce(g, 0, m).join("") : t.slice(0, m);
          if (a === i)
            return _ + l;
          if (g && (m += _.length - m), Nl(a)) {
            if (t.slice(m).search(a)) {
              var P, j = _;
              for (a.global || (a = el(a.source, gt(na.exec(a)) + "g")), a.lastIndex = 0; P = a.exec(j); )
                var O = P.index;
              _ = _.slice(0, O === i ? m : O);
            }
          } else if (t.indexOf(mr(a), m) != m) {
            var W = _.lastIndexOf(a);
            W > -1 && (_ = _.slice(0, W));
          }
          return _ + l;
        }
        function mw(t) {
          return t = gt(t), t && Ph.test(t) ? t.replace(ta, Xv) : t;
        }
        var ww = hn(function(t, r, n) {
          return t + (n ? " " : "") + r.toUpperCase();
        }), Fl = zs("toUpperCase");
        function kc(t, r, n) {
          return t = gt(t), r = n ? i : r, r === i ? $v(t) ? Vv(t) : Ov(t) : t.match(r) || [];
        }
        var Sc = tt(function(t, r) {
          try {
            return gr(t, i, r);
          } catch (n) {
            return Tl(n) ? n : new Y(n);
          }
        }), yw = ue(function(t, r) {
          return Sr(r, function(n) {
            n = Yr(n), oe(t, n, Wl(t[n], t));
          }), t;
        });
        function bw(t) {
          var r = t == null ? 0 : t.length, n = K();
          return t = r ? St(t, function(l) {
            if (typeof l[1] != "function")
              throw new zr(v);
            return [n(l[0]), l[1]];
          }) : [], tt(function(l) {
            for (var a = -1; ++a < r; ) {
              var h = t[a];
              if (gr(h[0], this, l))
                return gr(h[1], this, l);
            }
          });
        }
        function _w(t) {
          return Xd(Er(t, S));
        }
        function Bl(t) {
          return function() {
            return t;
          };
        }
        function xw(t, r) {
          return t == null || t !== t ? r : t;
        }
        var Rw = Es(), Cw = Es(!0);
        function ar(t) {
          return t;
        }
        function Ul(t) {
          return os(typeof t == "function" ? t : Er(t, S));
        }
        function kw(t) {
          return us(Er(t, S));
        }
        function Sw(t, r) {
          return as(t, Er(r, S));
        }
        var zw = tt(function(t, r) {
          return function(n) {
            return qn(n, t, r);
          };
        }), Pw = tt(function(t, r) {
          return function(n) {
            return qn(t, n, r);
          };
        });
        function Xl(t, r, n) {
          var l = Ft(r), a = Li(r, l);
          n == null && !(zt(r) && (a.length || !l.length)) && (n = r, r = t, t = this, a = Li(r, Ft(r)));
          var h = !(zt(n) && "chain" in n) || !!n.chain, g = se(t);
          return Sr(a, function(m) {
            var _ = r[m];
            t[m] = _, g && (t.prototype[m] = function() {
              var P = this.__chain__;
              if (h || P) {
                var j = t(this.__wrapped__), O = j.__actions__ = or(this.__actions__);
                return O.push({ func: _, args: arguments, thisArg: t }), j.__chain__ = P, j;
              }
              return _.apply(t, we([this.value()], arguments));
            });
          }), t;
        }
        function Ew() {
          return Ut._ === this && (Ut._ = rd), this;
        }
        function Kl() {
        }
        function jw(t) {
          return t = Q(t), tt(function(r) {
            return ss(r, t);
          });
        }
        var Aw = Cl(St), Ow = Cl(ja), Hw = Cl(Vo);
        function zc(t) {
          return Al(t) ? Yo(Yr(t)) : sg(t);
        }
        function Mw(t) {
          return function(r) {
            return t == null ? i : Te(t, r);
          };
        }
        var Dw = As(), Iw = As(!0);
        function Gl() {
          return [];
        }
        function Vl() {
          return !1;
        }
        function Ww() {
          return {};
        }
        function Lw() {
          return "";
        }
        function Tw() {
          return !0;
        }
        function Nw(t, r) {
          if (t = Q(t), t < 1 || t > ir)
            return [];
          var n = Jt, l = Gt(t, Jt);
          r = K(r), t -= Jt;
          for (var a = Jo(l, r); ++n < t; )
            r(n);
          return a;
        }
        function $w(t) {
          return Z(t) ? St(t, Yr) : wr(t) ? [t] : or(Ks(gt(t)));
        }
        function qw(t) {
          var r = ++Jv;
          return gt(t) + r;
        }
        var Fw = Bi(function(t, r) {
          return t + r;
        }, 0), Bw = kl("ceil"), Uw = Bi(function(t, r) {
          return t / r;
        }, 1), Xw = kl("floor");
        function Kw(t) {
          return t && t.length ? Wi(t, ar, cl) : i;
        }
        function Gw(t, r) {
          return t && t.length ? Wi(t, K(r, 2), cl) : i;
        }
        function Vw(t) {
          return Ha(t, ar);
        }
        function Yw(t, r) {
          return Ha(t, K(r, 2));
        }
        function Zw(t) {
          return t && t.length ? Wi(t, ar, dl) : i;
        }
        function Qw(t, r) {
          return t && t.length ? Wi(t, K(r, 2), dl) : i;
        }
        var Jw = Bi(function(t, r) {
          return t * r;
        }, 1), ty = kl("round"), ry = Bi(function(t, r) {
          return t - r;
        }, 0);
        function ey(t) {
          return t && t.length ? Qo(t, ar) : 0;
        }
        function ny(t, r) {
          return t && t.length ? Qo(t, K(r, 2)) : 0;
        }
        return f.after = k0, f.ary = ic, f.assign = hm, f.assignIn = wc, f.assignInWith = no, f.assignWith = vm, f.at = dm, f.before = oc, f.bind = Wl, f.bindAll = yw, f.bindKey = lc, f.castArray = W0, f.chain = rc, f.chunk = Xg, f.compact = Kg, f.concat = Gg, f.cond = bw, f.conforms = _w, f.constant = Bl, f.countBy = e0, f.create = gm, f.curry = uc, f.curryRight = ac, f.debounce = sc, f.defaults = pm, f.defaultsDeep = mm, f.defer = S0, f.delay = z0, f.difference = Vg, f.differenceBy = Yg, f.differenceWith = Zg, f.drop = Qg, f.dropRight = Jg, f.dropRightWhile = tp, f.dropWhile = rp, f.fill = ep, f.filter = i0, f.flatMap = u0, f.flatMapDeep = a0, f.flatMapDepth = s0, f.flatten = Zs, f.flattenDeep = np, f.flattenDepth = ip, f.flip = P0, f.flow = Rw, f.flowRight = Cw, f.fromPairs = op, f.functions = Cm, f.functionsIn = km, f.groupBy = c0, f.initial = up, f.intersection = ap, f.intersectionBy = sp, f.intersectionWith = cp, f.invert = zm, f.invertBy = Pm, f.invokeMap = h0, f.iteratee = Ul, f.keyBy = v0, f.keys = Ft, f.keysIn = ur, f.map = Zi, f.mapKeys = jm, f.mapValues = Am, f.matches = kw, f.matchesProperty = Sw, f.memoize = Ji, f.merge = Om, f.mergeWith = yc, f.method = zw, f.methodOf = Pw, f.mixin = Xl, f.negate = to, f.nthArg = jw, f.omit = Hm, f.omitBy = Mm, f.once = E0, f.orderBy = d0, f.over = Aw, f.overArgs = j0, f.overEvery = Ow, f.overSome = Hw, f.partial = Ll, f.partialRight = cc, f.partition = g0, f.pick = Dm, f.pickBy = bc, f.property = zc, f.propertyOf = Mw, f.pull = dp, f.pullAll = Js, f.pullAllBy = gp, f.pullAllWith = pp, f.pullAt = mp, f.range = Dw, f.rangeRight = Iw, f.rearg = A0, f.reject = w0, f.remove = wp, f.rest = O0, f.reverse = Dl, f.sampleSize = b0, f.set = Wm, f.setWith = Lm, f.shuffle = _0, f.slice = yp, f.sortBy = C0, f.sortedUniq = Sp, f.sortedUniqBy = zp, f.split = uw, f.spread = H0, f.tail = Pp, f.take = Ep, f.takeRight = jp, f.takeRightWhile = Ap, f.takeWhile = Op, f.tap = Kp, f.throttle = M0, f.thru = Yi, f.toArray = gc, f.toPairs = _c, f.toPairsIn = xc, f.toPath = $w, f.toPlainObject = mc, f.transform = Tm, f.unary = D0, f.union = Hp, f.unionBy = Mp, f.unionWith = Dp, f.uniq = Ip, f.uniqBy = Wp, f.uniqWith = Lp, f.unset = Nm, f.unzip = Il, f.unzipWith = tc, f.update = $m, f.updateWith = qm, f.values = gn, f.valuesIn = Fm, f.without = Tp, f.words = kc, f.wrap = I0, f.xor = Np, f.xorBy = $p, f.xorWith = qp, f.zip = Fp, f.zipObject = Bp, f.zipObjectDeep = Up, f.zipWith = Xp, f.entries = _c, f.entriesIn = xc, f.extend = wc, f.extendWith = no, Xl(f, f), f.add = Fw, f.attempt = Sc, f.camelCase = Km, f.capitalize = Rc, f.ceil = Bw, f.clamp = Bm, f.clone = L0, f.cloneDeep = N0, f.cloneDeepWith = $0, f.cloneWith = T0, f.conformsTo = q0, f.deburr = Cc, f.defaultTo = xw, f.divide = Uw, f.endsWith = Gm, f.eq = Fr, f.escape = Vm, f.escapeRegExp = Ym, f.every = n0, f.find = o0, f.findIndex = Vs, f.findKey = wm, f.findLast = l0, f.findLastIndex = Ys, f.findLastKey = ym, f.floor = Xw, f.forEach = ec, f.forEachRight = nc, f.forIn = bm, f.forInRight = _m, f.forOwn = xm, f.forOwnRight = Rm, f.get = $l, f.gt = F0, f.gte = B0, f.has = Sm, f.hasIn = ql, f.head = Qs, f.identity = ar, f.includes = f0, f.indexOf = lp, f.inRange = Um, f.invoke = Em, f.isArguments = qe, f.isArray = Z, f.isArrayBuffer = U0, f.isArrayLike = lr, f.isArrayLikeObject = Ht, f.isBoolean = X0, f.isBuffer = ke, f.isDate = K0, f.isElement = G0, f.isEmpty = V0, f.isEqual = Y0, f.isEqualWith = Z0, f.isError = Tl, f.isFinite = Q0, f.isFunction = se, f.isInteger = fc, f.isLength = ro, f.isMap = hc, f.isMatch = J0, f.isMatchWith = tm, f.isNaN = rm, f.isNative = em, f.isNil = im, f.isNull = nm, f.isNumber = vc, f.isObject = zt, f.isObjectLike = jt, f.isPlainObject = Gn, f.isRegExp = Nl, f.isSafeInteger = om, f.isSet = dc, f.isString = eo, f.isSymbol = wr, f.isTypedArray = dn, f.isUndefined = lm, f.isWeakMap = um, f.isWeakSet = am, f.join = fp, f.kebabCase = Zm, f.last = Ar, f.lastIndexOf = hp, f.lowerCase = Qm, f.lowerFirst = Jm, f.lt = sm, f.lte = cm, f.max = Kw, f.maxBy = Gw, f.mean = Vw, f.meanBy = Yw, f.min = Zw, f.minBy = Qw, f.stubArray = Gl, f.stubFalse = Vl, f.stubObject = Ww, f.stubString = Lw, f.stubTrue = Tw, f.multiply = Jw, f.nth = vp, f.noConflict = Ew, f.noop = Kl, f.now = Qi, f.pad = tw, f.padEnd = rw, f.padStart = ew, f.parseInt = nw, f.random = Xm, f.reduce = p0, f.reduceRight = m0, f.repeat = iw, f.replace = ow, f.result = Im, f.round = ty, f.runInContext = b, f.sample = y0, f.size = x0, f.snakeCase = lw, f.some = R0, f.sortedIndex = bp, f.sortedIndexBy = _p, f.sortedIndexOf = xp, f.sortedLastIndex = Rp, f.sortedLastIndexBy = Cp, f.sortedLastIndexOf = kp, f.startCase = aw, f.startsWith = sw, f.subtract = ry, f.sum = ey, f.sumBy = ny, f.template = cw, f.times = Nw, f.toFinite = ce, f.toInteger = Q, f.toLength = pc, f.toLower = fw, f.toNumber = Or, f.toSafeInteger = fm, f.toString = gt, f.toUpper = hw, f.trim = vw, f.trimEnd = dw, f.trimStart = gw, f.truncate = pw, f.unescape = mw, f.uniqueId = qw, f.upperCase = ww, f.upperFirst = Fl, f.each = ec, f.eachRight = nc, f.first = Qs, Xl(f, function() {
          var t = {};
          return Gr(f, function(r, n) {
            wt.call(f.prototype, n) || (t[n] = r);
          }), t;
        }(), { chain: !1 }), f.VERSION = u, Sr(["bind", "bindKey", "curry", "curryRight", "partial", "partialRight"], function(t) {
          f[t].placeholder = f;
        }), Sr(["drop", "take"], function(t, r) {
          ot.prototype[t] = function(n) {
            n = n === i ? 1 : $t(Q(n), 0);
            var l = this.__filtered__ && !r ? new ot(this) : this.clone();
            return l.__filtered__ ? l.__takeCount__ = Gt(n, l.__takeCount__) : l.__views__.push({
              size: Gt(n, Jt),
              type: t + (l.__dir__ < 0 ? "Right" : "")
            }), l;
          }, ot.prototype[t + "Right"] = function(n) {
            return this.reverse()[t](n).reverse();
          };
        }), Sr(["filter", "map", "takeWhile"], function(t, r) {
          var n = r + 1, l = n == rt || n == Qt;
          ot.prototype[t] = function(a) {
            var h = this.clone();
            return h.__iteratees__.push({
              iteratee: K(a, 3),
              type: n
            }), h.__filtered__ = h.__filtered__ || l, h;
          };
        }), Sr(["head", "last"], function(t, r) {
          var n = "take" + (r ? "Right" : "");
          ot.prototype[t] = function() {
            return this[n](1).value()[0];
          };
        }), Sr(["initial", "tail"], function(t, r) {
          var n = "drop" + (r ? "" : "Right");
          ot.prototype[t] = function() {
            return this.__filtered__ ? new ot(this) : this[n](1);
          };
        }), ot.prototype.compact = function() {
          return this.filter(ar);
        }, ot.prototype.find = function(t) {
          return this.filter(t).head();
        }, ot.prototype.findLast = function(t) {
          return this.reverse().find(t);
        }, ot.prototype.invokeMap = tt(function(t, r) {
          return typeof t == "function" ? new ot(this) : this.map(function(n) {
            return qn(n, t, r);
          });
        }), ot.prototype.reject = function(t) {
          return this.filter(to(K(t)));
        }, ot.prototype.slice = function(t, r) {
          t = Q(t);
          var n = this;
          return n.__filtered__ && (t > 0 || r < 0) ? new ot(n) : (t < 0 ? n = n.takeRight(-t) : t && (n = n.drop(t)), r !== i && (r = Q(r), n = r < 0 ? n.dropRight(-r) : n.take(r - t)), n);
        }, ot.prototype.takeRightWhile = function(t) {
          return this.reverse().takeWhile(t).reverse();
        }, ot.prototype.toArray = function() {
          return this.take(Jt);
        }, Gr(ot.prototype, function(t, r) {
          var n = /^(?:filter|find|map|reject)|While$/.test(r), l = /^(?:head|last)$/.test(r), a = f[l ? "take" + (r == "last" ? "Right" : "") : r], h = l || /^find/.test(r);
          a && (f.prototype[r] = function() {
            var g = this.__wrapped__, m = l ? [1] : arguments, _ = g instanceof ot, P = m[0], j = _ || Z(g), O = function(et) {
              var ut = a.apply(f, we([et], m));
              return l && W ? ut[0] : ut;
            };
            j && n && typeof P == "function" && P.length != 1 && (_ = j = !1);
            var W = this.__chain__, X = !!this.__actions__.length, G = h && !W, J = _ && !X;
            if (!h && j) {
              g = J ? g : new ot(this);
              var V = t.apply(g, m);
              return V.__actions__.push({ func: Yi, args: [O], thisArg: i }), new Pr(V, W);
            }
            return G && J ? t.apply(this, m) : (V = this.thru(O), G ? l ? V.value()[0] : V.value() : V);
          });
        }), Sr(["pop", "push", "shift", "sort", "splice", "unshift"], function(t) {
          var r = xi[t], n = /^(?:push|sort|unshift)$/.test(t) ? "tap" : "thru", l = /^(?:pop|shift)$/.test(t);
          f.prototype[t] = function() {
            var a = arguments;
            if (l && !this.__chain__) {
              var h = this.value();
              return r.apply(Z(h) ? h : [], a);
            }
            return this[n](function(g) {
              return r.apply(Z(g) ? g : [], a);
            });
          };
        }), Gr(ot.prototype, function(t, r) {
          var n = f[r];
          if (n) {
            var l = n.name + "";
            wt.call(sn, l) || (sn[l] = []), sn[l].push({ name: r, func: n });
          }
        }), sn[Fi(i, L).name] = [{
          name: "wrapper",
          func: i
        }], ot.prototype.clone = md, ot.prototype.reverse = wd, ot.prototype.value = yd, f.prototype.at = Gp, f.prototype.chain = Vp, f.prototype.commit = Yp, f.prototype.next = Zp, f.prototype.plant = Jp, f.prototype.reverse = t0, f.prototype.toJSON = f.prototype.valueOf = f.prototype.value = r0, f.prototype.first = f.prototype.head, Dn && (f.prototype[Dn] = Qp), f;
      }, ln = Yv();
      Me ? ((Me.exports = ln)._ = ln, Uo._ = ln) : Ut._ = ln;
    }).call(Hb);
  }(uo, uo.exports)), uo.exports;
}
var Su = Mb();
const gh = /* @__PURE__ */ Yu(Su), Db = {
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
class Ib {
  #t = /* @__PURE__ */ F(Zt(Db));
  get config() {
    return d(this.#t);
  }
  set config(e) {
    A(this.#t, e, !0);
  }
}
const Fc = Symbol("config");
class bt {
  static initialize() {
    Mr(Fc, new Ib());
  }
  static get config() {
    const e = fr(Fc);
    if (e == null)
      throw new Error("config context not yet set");
    return e.config;
  }
}
class Wb {
  tableModel;
  tableController;
  margin = 2;
  isDragging = !1;
  lastDragX = 0;
  #t = /* @__PURE__ */ F(0);
  get elementWidth() {
    return d(this.#t);
  }
  set elementWidth(e) {
    A(this.#t, e, !0);
  }
  #r = /* @__PURE__ */ M(() => this.elementWidth - this.margin * 2);
  get scrollbarWidth() {
    return d(this.#r);
  }
  set scrollbarWidth(e) {
    A(this.#r, e);
  }
  #e = /* @__PURE__ */ M(() => this.tableController.viewWidth / this.tableModel.colsRightmostPosition * this.scrollbarWidth);
  get pillWidth() {
    return d(this.#e);
  }
  set pillWidth(e) {
    A(this.#e, e);
  }
  #n = /* @__PURE__ */ M(() => -this.tableController.xScroll / this.tableModel.colsRightmostPosition * this.scrollbarWidth);
  get pillLeft() {
    return d(this.#n);
  }
  set pillLeft(e) {
    A(this.#n, e);
  }
  constructor({ tableModel: e, tableController: i }) {
    this.tableModel = e, this.tableController = i;
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
const Bc = "mosaic-coordinator";
class zu {
  static get coordinator() {
    return fr(Bc) ?? oy();
  }
  static set coordinator(e) {
    Mr(Bc, e);
  }
}
const sr = "__oid", Lb = 120;
class Tb {
  schema;
  #t = /* @__PURE__ */ F(Zt({}));
  get data() {
    return d(this.#t);
  }
  set data(e) {
    A(this.#t, e, !0);
  }
  #r = /* @__PURE__ */ F(Zt({}));
  get defaultColWidths() {
    return d(this.#r);
  }
  set defaultColWidths(e) {
    A(this.#r, e, !0);
  }
  #e = /* @__PURE__ */ F(Zt([]));
  get columns() {
    return d(this.#e);
  }
  set columns(e) {
    A(this.#e, e, !0);
  }
  #n = /* @__PURE__ */ F(0);
  get numRows() {
    return d(this.#n);
  }
  set numRows(e) {
    A(this.#n, e, !0);
  }
  #l = /* @__PURE__ */ F(0);
  get renderOffset() {
    return d(this.#l);
  }
  set renderOffset(e) {
    A(this.#l, e, !0);
  }
  #i = /* @__PURE__ */ F(Zt({}));
  get rowHeightAddition() {
    return d(this.#i);
  }
  set rowHeightAddition(e) {
    A(this.#i, e, !0);
  }
  #o = /* @__PURE__ */ M(() => this.columns.reduce(
    (e, i) => (bt.config.columnConfigs[i]?.hidden && e.add(i), i === sr && bt.config.showRowNumber === !1 && e.add(sr), e),
    /* @__PURE__ */ new Set()
  ));
  get hiddenColumns() {
    return d(this.#o);
  }
  set hiddenColumns(e) {
    A(this.#o, e);
  }
  rowKeyColumn = null;
  constructor(e) {
    this.schema = e;
  }
  #a = /* @__PURE__ */ M(() => Object.keys(this.data).sort((e, i) => this.data[e][sr] - this.data[i][sr]));
  get renderableRows() {
    return d(this.#a);
  }
  set renderableRows(e) {
    A(this.#a, e);
  }
  #u = /* @__PURE__ */ M(() => this.columns.filter((e) => !this.hiddenColumns.has(e)));
  get renderableCols() {
    return d(this.#u);
  }
  set renderableCols(e) {
    A(this.#u, e);
  }
  #s = /* @__PURE__ */ M(() => this.renderableRows.length === 0 ? this.zeroRowPosition : Math.min(...this.renderableRows.map((e) => this.rowPositions[e])));
  get minRowPosition() {
    return d(this.#s);
  }
  set minRowPosition(e) {
    A(this.#s, e);
  }
  #f = /* @__PURE__ */ M(() => this.renderableRows.length === 0 ? this.finalRowPosition : Math.max(...this.renderableRows.map((e) => this.rowPositions[e])));
  get maxRowPosition() {
    return d(this.#f);
  }
  set maxRowPosition(e) {
    A(this.#f, e);
  }
  #h = /* @__PURE__ */ M(() => {
    const e = Math.min(...this.renderableRows.map((i) => this.data[i][sr]));
    return Number.isSafeInteger(e) ? e : 0;
  });
  get minRowOID() {
    return d(this.#h);
  }
  set minRowOID(e) {
    A(this.#h, e);
  }
  #d = /* @__PURE__ */ M(() => {
    const e = Math.max(...this.renderableRows.map((i) => this.data[i][sr]));
    return Number.isSafeInteger(e) ? e : 0;
  });
  get maxRowOID() {
    return d(this.#d);
  }
  set maxRowOID(e) {
    A(this.#d, e);
  }
  #c = /* @__PURE__ */ M(() => 0);
  get zeroRowPosition() {
    return d(this.#c);
  }
  set zeroRowPosition(e) {
    A(this.#c, e);
  }
  #v = /* @__PURE__ */ M(() => (this.numRows - 1) * bt.config.rowHeight + this.rowPositionOffsets.cumulative);
  get finalRowPosition() {
    return d(this.#v);
  }
  set finalRowPosition(e) {
    A(this.#v, e);
  }
  colsLeftmostPosition = 0;
  #g = /* @__PURE__ */ M(() => {
    const e = this.renderableCols[this.renderableCols.length - 1];
    return this.colPositions[e] + this.colWidths[e];
  });
  get colsRightmostPosition() {
    return d(this.#g);
  }
  set colsRightmostPosition(e) {
    A(this.#g, e);
  }
  #p = /* @__PURE__ */ M(() => this.renderableRows.reduce(
    ({ offsets: e, cumulative: i }, u) => {
      e[u] = i;
      const s = this.rowHeightAddition[u] ?? 0;
      return { offsets: e, cumulative: i + s };
    },
    { offsets: {}, cumulative: 0 }
  ));
  get rowPositionOffsets() {
    return d(this.#p);
  }
  set rowPositionOffsets(e) {
    A(this.#p, e);
  }
  #m = /* @__PURE__ */ M(() => this.renderableRows.reduce(
    (e, i) => {
      const u = (this.data[i][sr] - 1) * bt.config.rowHeight + this.rowPositionOffsets.offsets[i];
      return e[i] = u, e;
    },
    {}
  ));
  get rowPositions() {
    return d(this.#m);
  }
  set rowPositions(e) {
    A(this.#m, e);
  }
  #w = /* @__PURE__ */ M(() => {
    let e = 0;
    return this.columns.reduce(
      (i, u, s) => (this.hiddenColumns.has(u) || (i[u] = e, e += this.colWidths[u]), i),
      {}
    );
  });
  get colPositions() {
    return d(this.#w);
  }
  set colPositions(e) {
    A(this.#w, e);
  }
  #y = /* @__PURE__ */ M(() => this.renderableRows.reduce(
    (e, i) => (e[i] = bt.config.rowHeight + (this.rowHeightAddition[i] ?? 0), e),
    {}
  ));
  get rowHeights() {
    return d(this.#y);
  }
  set rowHeights(e) {
    A(this.#y, e);
  }
  #b = /* @__PURE__ */ M(() => this.columns.reduce(
    (e, i, u) => (e[i] = Math.max(bt.config.columnConfigs[i]?.width ?? this.defaultColWidths[i] ?? Lb, bt.config.minColumnWidths[i] ?? 0), this.isFirstCol(i) && (e[i] += bt.config.firstColLeftPadding), this.isLastCol(i) && (e[i] += bt.config.verticalScrollbarWidth), e),
    {}
  ));
  get colWidths() {
    return d(this.#b);
  }
  set colWidths(e) {
    A(this.#b, e);
  }
  getContent({ row: e, col: i }) {
    return this.data[e] ? this.data[e][i] : null;
  }
  getRowData(e) {
    return this.data[e] ? this.data[e] : null;
  }
  getPosition({ row: e, col: i }) {
    const u = this.colPositions[i], s = this.rowPositions[e];
    return { x: u, y: s };
  }
  getDimensions({ row: e, col: i }) {
    const u = this.colWidths[i], s = this.rowHeights[e];
    return { width: u, height: s };
  }
  getRowParity(e) {
    return this.data[e] && this.data[e][sr] % 2 === 0 ? "even" : "odd";
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
    const i = this.rowHeightAddition[e] ?? 0;
    return delete this.rowHeightAddition[e], i;
  }
  collapseRow(e) {
    const i = this.rowHeightAddition[e] ?? 0;
    return delete this.rowHeightAddition[e], i;
  }
  reset() {
    this.data = {}, this.rowHeightAddition = {};
  }
  teardown() {
    this.reset();
  }
}
class Nb extends yf {
  tableName;
  onResult;
  constructor(e, i, u) {
    super(i ?? void 0), this.tableName = e, this.onResult = u;
  }
  queryResult(e) {
    const i = e.toArray()[0].count;
    return this.onResult(i), this;
  }
  query(e = []) {
    return so.from(this.tableName).select({ count: cy() }).where(e);
  }
}
const cr = "__oid";
class $b extends yf {
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
  constructor(e, i, u, s, c) {
    super(u ?? void 0), this.tableName = e, this.columns = i, this.onResult = s, this.onColumnInfo = c;
  }
  async prepare() {
    if (this.coordinator == null)
      return;
    const e = (await iy(this.coordinator, [{ table: this.tableName, column: "*" }])).reduce((i, u) => (i[u.column] = u, i), {});
    this.columnInfo = e, this.onColumnInfo(e), this.isReady = !0;
  }
  getSelect({ includeRowNumber: e } = { includeRowNumber: !0 }) {
    const i = this.columns.reduce((u, s) => (this.columnInfo?.[s]?.sqlType === "BIGINT" ? u[s] = Ec(Yn(s), "TEXT") : u[s] = Yn(s), u), {});
    return e || delete i[cr], i;
  }
  queryResult(e) {
    return this.onResult(e), this;
  }
  query(e = []) {
    if (!this.isReady)
      return null;
    const i = this.columns.reduce((u, s) => (this.columnInfo?.[s]?.sqlType === "BIGINT" ? u[s] = Ec(Yn(s), "TEXT") : u[s] = Yn(s), u), {});
    if (i[cr] = ay(), this.sort) {
      const u = this.sort.direction === "ascending" ? this.sort.column : sy(this.sort.column);
      i[cr] = i[cr].orderby(u);
    }
    return so.from(this.tableName).select(i).where(e).limit(this.limit).offset(this.offset);
  }
  fetchRows(e, i) {
    this.offset = e, this.limit = i, this.requestUpdate();
  }
}
class qb {
  model;
  schema;
  config;
  #t = /* @__PURE__ */ M(() => zu.coordinator);
  get coordinator() {
    return d(this.#t);
  }
  set coordinator(e) {
    A(this.#t, e);
  }
  filterBy = null;
  rowsClient = null;
  numRowsClient = null;
  rowKeyColumn = null;
  #r = /* @__PURE__ */ F(null);
  get element() {
    return d(this.#r);
  }
  set element(e) {
    A(this.#r, e, !0);
  }
  #e = /* @__PURE__ */ F(0);
  get viewHeight() {
    return d(this.#e);
  }
  set viewHeight(e) {
    A(this.#e, e, !0);
  }
  #n = /* @__PURE__ */ F(0);
  get viewWidth() {
    return d(this.#n);
  }
  set viewWidth(e) {
    A(this.#n, e, !0);
  }
  #l = /* @__PURE__ */ F(0);
  get yScroll() {
    return d(this.#l);
  }
  set yScroll(e) {
    A(this.#l, e, !0);
  }
  #i = /* @__PURE__ */ F(0);
  get xScroll() {
    return d(this.#i);
  }
  set xScroll(e) {
    A(this.#i, e, !0);
  }
  #o = /* @__PURE__ */ F(!1);
  get isFetching() {
    return d(this.#o);
  }
  set isFetching(e) {
    A(this.#o, e, !0);
  }
  #a = /* @__PURE__ */ F(!1);
  get isJumping() {
    return d(this.#a);
  }
  set isJumping(e) {
    A(this.#a, e, !0);
  }
  #u = /* @__PURE__ */ F(null);
  get sort() {
    return d(this.#u);
  }
  set sort(e) {
    A(this.#u, e, !0);
  }
  #s = /* @__PURE__ */ F(!1);
  get isReady() {
    return d(this.#s);
  }
  set isReady(e) {
    A(this.#s, e, !0);
  }
  #f = /* @__PURE__ */ F(0);
  get updateKey() {
    return d(this.#f);
  }
  set updateKey(e) {
    A(this.#f, e, !0);
  }
  #h = /* @__PURE__ */ F(!1);
  get isStale() {
    return d(this.#h);
  }
  set isStale(e) {
    A(this.#h, e, !0);
  }
  #d = /* @__PURE__ */ F(null);
  get flashedRowId() {
    return d(this.#d);
  }
  set flashedRowId(e) {
    A(this.#d, e, !0);
  }
  #c = /* @__PURE__ */ F(null);
  get hoveredRowId() {
    return d(this.#c);
  }
  set hoveredRowId(e) {
    A(this.#c, e, !0);
  }
  #v = /* @__PURE__ */ M(() => Math.ceil(this.viewHeight / bt.config.rowHeight));
  get rowsOnScreen() {
    return d(this.#v);
  }
  set rowsOnScreen(e) {
    A(this.#v, e);
  }
  #g = /* @__PURE__ */ M(() => this.isJumping ? 0 : bt.config.renderWindowOffset);
  get renderWindowOffset() {
    return d(this.#g);
  }
  set renderWindowOffset(e) {
    A(this.#g, e);
  }
  #p = /* @__PURE__ */ M(() => {
    if (this.model.renderableRows.length === 0)
      return null;
    const e = this.model.renderableRows.filter((u) => {
      const s = this.model.rowPositions[u] + this.yScroll;
      return s + this.model.rowHeights[u] > 0 && s < this.viewHeight;
    });
    if (e.length === 0)
      return null;
    const i = e[0];
    return this.model.data[i][cr];
  });
  get firstVisibleRowOID() {
    return d(this.#p);
  }
  set firstVisibleRowOID(e) {
    A(this.#p, e);
  }
  #m = /* @__PURE__ */ M(() => Math.max(0, Math.floor(-this.yScroll / bt.config.rowHeight)));
  get offset() {
    return d(this.#m);
  }
  set offset(e) {
    A(this.#m, e);
  }
  onFetchResolveBegin = null;
  onFetchResolveEnd = null;
  constructor(e, i) {
    this.model = e, this.schema = i, this.config = bt.config;
  }
  handleFilterBy = () => {
    this.rowsClient && (this.rowsClient.offset = 0, this.rowsClient.limit = this.rowsOnScreen, this.isJumping = !0, this.markStale());
  };
  updateData = (e) => {
    if (!this.model || !this.rowKeyColumn)
      return;
    this.onFetchResolveBegin && (this.onFetchResolveBegin(), this.onFetchResolveBegin = null);
    const i = e.toArray(), u = {};
    for (const s of i) {
      const c = s[this.rowKeyColumn];
      u[c] = s;
    }
    this.model.data = { ...this.model.data, ...u }, this.onFetchResolveEnd && (this.onFetchResolveEnd(), this.onFetchResolveEnd = null), this.isFetching = !1;
  };
  initialize({ tableName: e, rowKey: i, columns: u, filterBy: s }) {
    if (this.model.columns = u, this.model.rowKeyColumn = i, this.rowKeyColumn = i, s && (this.filterBy = s, this.filterBy.addEventListener("value", this.handleFilterBy)), !this.rowKeyColumn)
      throw new Error("rowkey cannot be null");
    let c = u.includes(this.rowKeyColumn) ? u : [...u, this.rowKeyColumn];
    this.rowsClient = new $b(
      e,
      c,
      s,
      (v) => {
        this.updateData(v);
      },
      (v) => {
        this.schema.columnInfo = v, this.computeColWidths(e, u), this.isReady = !0;
      }
    ), this.coordinator.connect(this.rowsClient), this.numRowsClient = new Nb(e, s, (v) => {
      this.model && (this.model.numRows = v);
    }), this.coordinator.connect(this.numRowsClient), Pt(() => {
      if (!this.rowsClient || this.isFetching || !this.isReady)
        return;
      const v = -this.renderWindowOffset, w = this.viewHeight + this.renderWindowOffset, p = this.model.maxRowPosition + this.yScroll + this.config.rowHeight, y = this.model.minRowPosition + this.yScroll;
      if (y < 0 && p < 0 || y > this.viewHeight && p > this.viewHeight) {
        const D = this.rowsOnScreen;
        this.isFetching = !0, this.rowsClient.fetchRows(this.offset, D);
      } else {
        if (p < w) {
          const H = Su.clamp(Math.ceil((w - p) / this.config.rowHeight), this.config.minFetchSize, this.rowsOnScreen);
          H > 0 && this.model.maxRowOID !== this.model.numRows && (this.isFetching = !0, this.rowsClient.fetchRows(this.model.maxRowOID, H));
        }
        const D = this.model.minRowPosition + this.yScroll;
        if (D > v && this.model.minRowOID !== 1) {
          const H = Su.clamp(Math.ceil((D - v) / this.config.rowHeight), this.config.minFetchSize, this.rowsOnScreen);
          H > 0 && (this.isFetching = !0, this.rowsClient.fetchRows(Math.max(0, this.model.minRowOID - 1 - H), H));
        }
      }
      const x = Of(this.model.renderableRows);
      let S = 0;
      for (; this.model.rowPositions[x[S]] + this.yScroll + this.model.rowHeights[x[S]] < 0; )
        this.yScroll += this.model.collapseRow(x[S]), S += 1;
      let z = x.length - 1;
      for (; this.model.rowPositions[x[z]] + this.yScroll > this.viewHeight; )
        this.model.collapseRow(x[z]), z -= 1;
      let E = 0;
      for (; this.model.rowPositions[x[E]] + this.yScroll + this.model.rowHeights[x[E]] < v; )
        this.model.deleteRow(x[E]), E += 1;
      let k = x.length - 1;
      for (; this.model.rowPositions[x[k]] + this.yScroll > w; )
        this.model.deleteRow(x[k]), k -= 1;
    });
  }
  teardown() {
    this.filterBy && this.filterBy.removeEventListener("value", this.handleFilterBy);
  }
  cellIsVisible(e) {
    const { x: i, y: u } = this.model.getPosition(e), { width: s, height: c } = this.model.getDimensions(e), v = i + this.xScroll, w = u + this.yScroll;
    return v + s >= 0 && v <= this.viewWidth && w + c >= 0 && w <= this.viewHeight;
  }
  rowIsVisible(e) {
    const i = this.model.rowPositions[e], u = this.model.rowHeights[e], s = i + this.yScroll;
    return s + u >= 0 && s <= this.viewHeight;
  }
  rowStillExists(e) {
    return this.model.data[e] != null;
  }
  colIsVisible(e) {
    const i = this.model.colPositions[e], u = this.model.colWidths[e], s = i + this.xScroll;
    return s + u >= 0 && s <= this.viewWidth;
  }
  scroll({ deltaX: e, deltaY: i }) {
    if (Math.abs(i) > Math.abs(e)) {
      const u = this.yScroll - i;
      this.model.zeroRowPosition + u > 0 ? this.yScroll = -this.model.zeroRowPosition : this.model.finalRowPosition + u < 0 ? this.yScroll = -this.model.finalRowPosition : this.yScroll = u;
    } else {
      const u = this.xScroll - e;
      -u < 0 ? this.xScroll = 0 : -u > Math.max(this.model.colsRightmostPosition, this.viewWidth) - this.viewWidth ? this.xScroll = -Math.max(this.model.colsRightmostPosition, this.viewWidth) + this.viewWidth : this.xScroll = u;
    }
  }
  handleWheel = (e) => {
    e.preventDefault(), this.isJumping = !1, this.scroll({ deltaX: e.deltaX, deltaY: e.deltaY });
  };
  jumpToOffset(e) {
    if (!this.rowsClient)
      return;
    this.isFetching = !0;
    const i = this.rowsOnScreen, u = this.onFetchResolveEnd;
    this.onFetchResolveEnd = () => {
      u && u(), this.yScroll = -(e * this.config.rowHeight);
    }, this.markStale(), this.rowsClient.fetchRows(e, i);
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
  async scrollToRow(e, i = !0) {
    if (!this.rowsClient)
      return;
    this.isFetching = !0;
    const u = so.with({
      original: this.rowsClient.query(this.rowsClient.filterBy?.predicate(this.rowsClient)).offset(0).limit(this.model.numRows)
    }).select([cr]).from("original").where(ly(Yn(this.rowKeyColumn), uy(e))), s = (await this.coordinator.query(u)).toArray();
    if (s.length > 0) {
      const c = s[0][cr] - 1;
      this.onFetchResolveEnd = () => {
        i && this.flashRow(e);
      }, this.jumpToOffset(c);
    } else
      this.isFetching = !1, console.error("no row", e, "found");
  }
  addHeightToRow(e, i) {
    this.model.rowHeightAddition[e] = (this.model.rowHeightAddition[e] ?? 0) + i;
  }
  hideColumn(e) {
    e === cr ? this.config.onShowRowNumberChange ? this.config.onShowRowNumberChange(!1) : this.config.showRowNumber = !1 : (this.config.columnConfigs[e] || (this.config.columnConfigs[e] = {}), this.config.columnConfigs[e].hidden = !0);
  }
  showColumn(e) {
    e === cr ? this.config.onShowRowNumberChange ? this.config.onShowRowNumberChange(!0) : this.config.showRowNumber = !0 : (this.config.columnConfigs[e] || (this.config.columnConfigs[e] = {}), this.config.columnConfigs[e].hidden = !1);
  }
  // Marks the current state stale, telling the view to destroy any existing cells on next render.
  markStale() {
    this.isStale = !0;
    const e = this.onFetchResolveBegin;
    this.onFetchResolveBegin = () => {
      e && e(), this.resetRows();
    };
    const i = this.onFetchResolveEnd;
    this.onFetchResolveEnd = () => {
      i && i(), this.updateKey += 1, this.isStale = !1;
    };
  }
  async computeColWidths(e, i) {
    const u = i.filter((p) => p !== cr), s = this.rowsClient?.getSelect({ includeRowNumber: !1 }), c = u.reduce(
      (p, y) => (p[y] = 0, p),
      {}
    ), v = so.from(e).select(s).offset(0).limit(10), w = (await this.coordinator.query(v)).toArray();
    for (const p of w)
      for (const y of u)
        c[y] = Math.max(c[y], Fb(p[y]));
    i.includes(cr) && (c[cr] = this.config.DEFAULT_ROW_NUMBER_COL_WIDTH), this.model.defaultColWidths = c;
  }
}
function Fb(o) {
  const e = String(o).length;
  return e > 200 ? 600 : e > 100 ? 300 : e > 20 ? 200 : e > 10 ? 150 : 120;
}
class Bb {
  tableController;
  #t = /* @__PURE__ */ M(() => this.tableController.element);
  get tableElement() {
    return d(this.#t);
  }
  set tableElement(e) {
    A(this.#t, e);
  }
  constructor(e) {
    this.tableController = e;
  }
  mount(e, i, u, s, c) {
    if (!this.tableElement)
      return;
    const v = i.getBoundingClientRect(), w = this.tableElement.getBoundingClientRect(), p = w.top, y = w.left;
    switch (u) {
      case "inside":
        switch (c) {
          case "top":
            e.style.top = v.top - p + "px";
            break;
          case "middle":
          case "bottom":
            throw new Error("not yet implemented" + u + c);
        }
        switch (s) {
          case "left":
            e.style.left = v.left - y + "px";
          case "center":
          case "right":
            throw new Error("not yet implemented" + u + s);
        }
        break;
      case "outside":
        switch (c) {
          case "top":
            e.style.top = v.bottom - p + "px";
            break;
          case "middle":
          case "bottom":
            throw new Error("not yet implemented" + u + c);
        }
        switch (s) {
          case "left":
            e.style.left = v.left - y + "px";
            break;
          case "center":
          case "right":
            throw new Error("not yet implemented" + u + s);
        }
        break;
    }
    this.tableElement.appendChild(e);
  }
  destroy(e) {
    this.tableElement && this.tableElement.contains(e) && this.tableElement.removeChild(e);
  }
}
var Jl, Uc;
function Ub() {
  if (Uc) return Jl;
  Uc = 1;
  function o(e, i, u) {
    return e === e && (u !== void 0 && (e = e <= u ? e : u), i !== void 0 && (e = e >= i ? e : i)), e;
  }
  return Jl = o, Jl;
}
var tu, Xc;
function Xb() {
  if (Xc) return tu;
  Xc = 1;
  var o = /\s/;
  function e(i) {
    for (var u = i.length; u-- && o.test(i.charAt(u)); )
      ;
    return u;
  }
  return tu = e, tu;
}
var ru, Kc;
function Kb() {
  if (Kc) return ru;
  Kc = 1;
  var o = Xb(), e = /^\s+/;
  function i(u) {
    return u && u.slice(0, o(u) + 1).replace(e, "");
  }
  return ru = i, ru;
}
var eu, Gc;
function Zu() {
  if (Gc) return eu;
  Gc = 1;
  function o(e) {
    var i = typeof e;
    return e != null && (i == "object" || i == "function");
  }
  return eu = o, eu;
}
var nu, Vc;
function Gb() {
  if (Vc) return nu;
  Vc = 1;
  var o = typeof ze == "object" && ze && ze.Object === Object && ze;
  return nu = o, nu;
}
var iu, Yc;
function ph() {
  if (Yc) return iu;
  Yc = 1;
  var o = Gb(), e = typeof self == "object" && self && self.Object === Object && self, i = o || e || Function("return this")();
  return iu = i, iu;
}
var ou, Zc;
function mh() {
  if (Zc) return ou;
  Zc = 1;
  var o = ph(), e = o.Symbol;
  return ou = e, ou;
}
var lu, Qc;
function Vb() {
  if (Qc) return lu;
  Qc = 1;
  var o = mh(), e = Object.prototype, i = e.hasOwnProperty, u = e.toString, s = o ? o.toStringTag : void 0;
  function c(v) {
    var w = i.call(v, s), p = v[s];
    try {
      v[s] = void 0;
      var y = !0;
    } catch {
    }
    var x = u.call(v);
    return y && (w ? v[s] = p : delete v[s]), x;
  }
  return lu = c, lu;
}
var uu, Jc;
function Yb() {
  if (Jc) return uu;
  Jc = 1;
  var o = Object.prototype, e = o.toString;
  function i(u) {
    return e.call(u);
  }
  return uu = i, uu;
}
var au, tf;
function Zb() {
  if (tf) return au;
  tf = 1;
  var o = mh(), e = Vb(), i = Yb(), u = "[object Null]", s = "[object Undefined]", c = o ? o.toStringTag : void 0;
  function v(w) {
    return w == null ? w === void 0 ? s : u : c && c in Object(w) ? e(w) : i(w);
  }
  return au = v, au;
}
var su, rf;
function Qb() {
  if (rf) return su;
  rf = 1;
  function o(e) {
    return e != null && typeof e == "object";
  }
  return su = o, su;
}
var cu, ef;
function Jb() {
  if (ef) return cu;
  ef = 1;
  var o = Zb(), e = Qb(), i = "[object Symbol]";
  function u(s) {
    return typeof s == "symbol" || e(s) && o(s) == i;
  }
  return cu = u, cu;
}
var fu, nf;
function wh() {
  if (nf) return fu;
  nf = 1;
  var o = Kb(), e = Zu(), i = Jb(), u = NaN, s = /^[-+]0x[0-9a-f]+$/i, c = /^0b[01]+$/i, v = /^0o[0-7]+$/i, w = parseInt;
  function p(y) {
    if (typeof y == "number")
      return y;
    if (i(y))
      return u;
    if (e(y)) {
      var x = typeof y.valueOf == "function" ? y.valueOf() : y;
      y = e(x) ? x + "" : x;
    }
    if (typeof y != "string")
      return y === 0 ? y : +y;
    y = o(y);
    var S = c.test(y);
    return S || v.test(y) ? w(y.slice(2), S ? 2 : 8) : s.test(y) ? u : +y;
  }
  return fu = p, fu;
}
var hu, of;
function t_() {
  if (of) return hu;
  of = 1;
  var o = Ub(), e = wh();
  function i(u, s, c) {
    return c === void 0 && (c = s, s = void 0), c !== void 0 && (c = e(c), c = c === c ? c : 0), s !== void 0 && (s = e(s), s = s === s ? s : 0), o(e(u), s, c);
  }
  return hu = i, hu;
}
var r_ = t_();
const e_ = /* @__PURE__ */ Yu(r_);
var vu, lf;
function n_() {
  if (lf) return vu;
  lf = 1;
  var o = ph(), e = function() {
    return o.Date.now();
  };
  return vu = e, vu;
}
var du, uf;
function i_() {
  if (uf) return du;
  uf = 1;
  var o = Zu(), e = n_(), i = wh(), u = "Expected a function", s = Math.max, c = Math.min;
  function v(w, p, y) {
    var x, S, z, E, k, D, H = 0, L = !1, I = !1, U = !0;
    if (typeof w != "function")
      throw new TypeError(u);
    p = i(p) || 0, o(y) && (L = !!y.leading, I = "maxWait" in y, z = I ? s(i(y.maxWait) || 0, p) : z, U = "trailing" in y ? !!y.trailing : U);
    function q(at) {
      var rt = x, mt = S;
      return x = S = void 0, H = at, E = w.apply(mt, rt), E;
    }
    function N(at) {
      return H = at, k = setTimeout(ct, p), L ? q(at) : E;
    }
    function B(at) {
      var rt = at - D, mt = at - H, Qt = p - rt;
      return I ? c(Qt, z - mt) : Qt;
    }
    function T(at) {
      var rt = at - D, mt = at - H;
      return D === void 0 || rt >= p || rt < 0 || I && mt >= z;
    }
    function ct() {
      var at = e();
      if (T(at))
        return it(at);
      k = setTimeout(ct, B(at));
    }
    function it(at) {
      return k = void 0, U && x ? q(at) : (x = S = void 0, E);
    }
    function kt() {
      k !== void 0 && clearTimeout(k), H = 0, x = D = S = k = void 0;
    }
    function Tt() {
      return k === void 0 ? E : it(e());
    }
    function Et() {
      var at = e(), rt = T(at);
      if (x = arguments, S = this, D = at, rt) {
        if (k === void 0)
          return N(D);
        if (I)
          return clearTimeout(k), k = setTimeout(ct, p), q(D);
      }
      return k === void 0 && (k = setTimeout(ct, p)), E;
    }
    return Et.cancel = kt, Et.flush = Tt, Et;
  }
  return du = v, du;
}
var gu, af;
function o_() {
  if (af) return gu;
  af = 1;
  var o = i_(), e = Zu(), i = "Expected a function";
  function u(s, c, v) {
    var w = !0, p = !0;
    if (typeof s != "function")
      throw new TypeError(i);
    return e(v) && (w = "leading" in v ? !!v.leading : w, p = "trailing" in v ? !!v.trailing : p), o(s, c, {
      leading: w,
      maxWait: c,
      trailing: p
    });
  }
  return gu = u, gu;
}
var l_ = o_();
const sf = /* @__PURE__ */ Yu(l_);
class u_ {
  tableModel;
  tableController;
  isDragging = !1;
  #t = /* @__PURE__ */ F(0);
  get elementHeight() {
    return d(this.#t);
  }
  set elementHeight(e) {
    A(this.#t, e, !0);
  }
  #r = /* @__PURE__ */ F(0);
  get labelHeight() {
    return d(this.#r);
  }
  set labelHeight(e) {
    A(this.#r, e, !0);
  }
  #e = /* @__PURE__ */ M(() => bt.config.verticalScrollbarPillHeight);
  get pillHeight() {
    return d(this.#e);
  }
  set pillHeight(e) {
    A(this.#e, e);
  }
  #n = /* @__PURE__ */ M(() => this.elementHeight - this.pillHeight);
  get scrollbarHeight() {
    return d(this.#n);
  }
  set scrollbarHeight(e) {
    A(this.#n, e);
  }
  #l = /* @__PURE__ */ M(() => this.tableController.firstVisibleRowOID ? this.tableController.firstVisibleRowOID : this.tableController.offset + 1);
  get displayRow() {
    return d(this.#l);
  }
  set displayRow(e) {
    A(this.#l, e);
  }
  #i = /* @__PURE__ */ M(() => (this.displayRow - 1) / (this.tableModel.numRows - 1) * this.scrollbarHeight);
  get pillPosition() {
    return d(this.#i);
  }
  set pillPosition(e) {
    A(this.#i, e);
  }
  #o = /* @__PURE__ */ M(() => {
    if (this.pillPosition === null)
      return 0;
    const e = this.pillPosition + this.pillHeight / 2 - this.labelHeight / 2;
    if (e < 0)
      return e;
    const i = this.pillPosition + this.pillHeight / 2 + this.labelHeight / 2;
    return i > this.elementHeight ? i - this.elementHeight : 0;
  });
  get labelOffset() {
    return d(this.#o);
  }
  set labelOffset(e) {
    A(this.#o, e);
  }
  constructor({ tableModel: e, tableController: i }) {
    this.tableModel = e, this.tableController = i;
  }
  computeOffsetFromPointer = (e) => {
    this.isDragging = !0;
    let i = Math.round(e.offsetY / this.scrollbarHeight * (this.tableModel.numRows - 1));
    return e_(i, 0, this.tableModel.numRows - 1);
  };
  pointerDown = (e) => {
    e.preventDefault(), e.target.setPointerCapture(e.pointerId), this.isDragging = !0;
    const i = this.computeOffsetFromPointer(e);
    this.tableController.isJumping = !0, this.tableController.jumpToOffset(i);
  };
  handlePointerDown = sf(this.pointerDown, 50);
  pointerMove = (e) => {
    if (this.isDragging) {
      const i = this.computeOffsetFromPointer(e);
      this.tableController.jumpToOffset(i);
    }
  };
  handlePointerMove = sf(this.pointerMove, 50);
  handlePointerUp = (e) => {
    e.target.releasePointerCapture(e.pointerId), this.isDragging = !1, this.tableController.isJumping = !1;
  };
}
class a_ {
  #t = /* @__PURE__ */ F(null);
  get columnInfo() {
    return d(this.#t);
  }
  set columnInfo(e) {
    A(this.#t, e, !0);
  }
  #r = /* @__PURE__ */ M(() => this.columnInfo ? Object.keys(this.columnInfo).reduce(
    (e, i) => (e[i] = this.columnInfo[i].type, e),
    {}
  ) : {});
  get dataType() {
    return d(this.#r);
  }
  set dataType(e) {
    A(this.#r, e);
  }
  #e = /* @__PURE__ */ M(() => this.columnInfo ? Object.keys(this.columnInfo).reduce(
    (e, i) => (e[i] = this.columnInfo[i].sqlType, e),
    {}
  ) : {});
  get sqlType() {
    return d(this.#e);
  }
  set sqlType(e) {
    A(this.#e, e);
  }
}
class s_ {
  tableController;
  #t = /* @__PURE__ */ M(() => Math.floor(-this.tableController.yScroll / bt.config.scrollOverflowValue) * bt.config.scrollOverflowValue);
  get offset() {
    return d(this.#t);
  }
  set offset(e) {
    A(this.#t, e);
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
const cf = Symbol("schema"), ff = Symbol("model"), hf = Symbol("controller"), vf = Symbol("vertical-scrollbar-controller"), df = Symbol("horizontal-scrollbar-controller"), gf = Symbol("table-portal-controller"), pf = Symbol("overscroll-modifier");
class yt {
  static initialize() {
    const e = new a_(), i = new Tb(e), u = new qb(i, e), s = new u_({ tableModel: i, tableController: u }), c = new Wb({ tableModel: i, tableController: u }), v = new Bb(u), w = new s_(u);
    Mr(cf, e), Mr(ff, i), Mr(hf, u), Mr(vf, s), Mr(df, c), Mr(gf, v), Mr(pf, w);
  }
  static get schema() {
    return fr(cf);
  }
  static get model() {
    return fr(ff);
  }
  static get controller() {
    return fr(hf);
  }
  static get verticalScrollbarController() {
    return fr(vf);
  }
  static get horizontalScrollbarController() {
    return fr(df);
  }
  static get tablePortalController() {
    return fr(gf);
  }
  static get overscrollModifier() {
    return fr(pf);
  }
}
var c_ = /* @__PURE__ */ dt('<div class="horizontal-scrollbar svelte-1poinb5"><div class="pill svelte-1poinb5"></div></div>');
const f_ = {
  hash: "svelte-1poinb5",
  code: ".horizontal-scrollbar.svelte-1poinb5 {position:absolute;bottom:0;left:0;width:100%;height:var(--height);transition:opacity 200ms linear;background-color:var(--scrollbar-bg);}.horizontal-scrollbar.svelte-1poinb5:hover {opacity:1 !important;}.pill.svelte-1poinb5 {width:var(--width);height:calc(var(--height) - var(--margin) * 2);margin:var(--margin);border-radius:2px;background-color:var(--scrollbar-pill-bg);}"
};
function h_(o, e) {
  Dt(e, !0), Ot(o, f_);
  const i = yt.horizontalScrollbarController, u = yt.controller, s = bt.config;
  let c = /* @__PURE__ */ F(0), v = /* @__PURE__ */ F(null), w = /* @__PURE__ */ F(null), p = 0;
  kn(() => (p = requestAnimationFrame(S), () => {
    cancelAnimationFrame(p);
  }));
  function y() {
    d(v) && (d(v).style.opacity = "0");
  }
  const x = gh.debounce(y, 1e3);
  Pt(() => {
    d(v) && (u.xScroll, d(v).style.opacity = "1", x());
  });
  function S() {
    A(c, i.pillWidth, !0), d(w) && (d(w).style.transform = `translate(${i.pillLeft}px, 0)`), p = requestAnimationFrame(S);
  }
  var z = c_();
  let E;
  var k = pt(z);
  k.__pointerdown = function(...H) {
    i.handlePointerDown?.apply(this, H);
  }, k.__pointermove = function(...H) {
    i.handlePointerMove?.apply(this, H);
  }, k.__pointerup = function(...H) {
    i.handlePointerUp?.apply(this, H);
  };
  let D;
  vr(k, (H) => A(w, H), () => d(w)), ht(z), vr(z, (H) => A(v, H), () => d(v)), Lt(
    (H, L) => {
      E = dr(z, "", E, H), D = dr(k, "", D, L);
    },
    [
      () => ({ "--height": s.horizontalScrollbarHeight + "px" }),
      () => ({
        "--width": d(c) + "px",
        "--margin": i.margin + "px"
      })
    ]
  ), Kr(z, "clientWidth", (H) => i.elementWidth = H), nt(o, z), It();
}
pe(["pointerdown", "pointermove", "pointerup"]);
var v_ = /* @__PURE__ */ dt('<div class="vertical-scrollbar svelte-15rl9bf"><div class="pill svelte-15rl9bf"><div class="label svelte-15rl9bf"> </div></div></div>');
const d_ = {
  hash: "svelte-15rl9bf",
  code: ".vertical-scrollbar.svelte-15rl9bf {position:absolute;right:0;top:0;width:var(--width);height:calc(100% - var(--offset-bottom));contain:layout;cursor:row-resize;transition:opacity 200ms linear;user-select:none;background-color:var(--scrollbar-bg);}.vertical-scrollbar.svelte-15rl9bf:hover {opacity:1 !important;}.pill.svelte-15rl9bf {--pill-height: 4px;position:relative;pointer-events:none; /* let the container respond to pointer events */top:0;left:0;width:calc(var(--width) - 2px);margin-left:1px;margin-right:1px;height:var(--pill-height);border-radius:2px;will-change:transform;background-color:var(--scrollbar-pill-bg);}.label.svelte-15rl9bf {--offset: 0;position:absolute;pointer-events:none;top:0;left:-4px;font-family:var(--font-family);font-size:14px;white-space:nowrap;padding:2px 4px;box-shadow:var(--shadow);transform:translate(-100%, calc(-50% + var(--pill-height) / 2 - var(--offset)));border-radius:2px;color:var(--secondary-text-color);background-color:var(--scrollbar-label-bg);border:var(--outline);}"
};
function g_(o, e) {
  Dt(e, !0), Ot(o, d_);
  const i = yt.verticalScrollbarController, u = yt.controller, s = bt.config;
  let c = /* @__PURE__ */ F(0), v = /* @__PURE__ */ F(0), w = /* @__PURE__ */ F(null), p = /* @__PURE__ */ F(null), y = /* @__PURE__ */ F(null), x = /* @__PURE__ */ M(() => new Intl.NumberFormat().format(d(v))), S = 0;
  kn(() => (S = requestAnimationFrame(k), () => {
    cancelAnimationFrame(S);
  }));
  function z() {
    d(w) && (d(w).style.opacity = "0");
  }
  const E = gh.debounce(z, 1e3);
  Pt(() => {
    d(w) && (u.yScroll, d(w).style.opacity = "1", E());
  });
  function k() {
    A(c, i.pillPosition ?? d(c), !0), A(v, i.displayRow ?? d(v), !0), d(p) && (d(p).style.transform = `translate3d(0, ${d(c)}px, 0)`), d(y) && d(y).style.setProperty("--offset", i.labelOffset - 1 + "px"), S = requestAnimationFrame(k);
  }
  var D = v_();
  D.__pointerdown = function(...N) {
    i.handlePointerDown?.apply(this, N);
  }, D.__pointermove = function(...N) {
    i.handlePointerMove?.apply(this, N);
  }, D.__pointerup = function(...N) {
    i.handlePointerUp?.apply(this, N);
  };
  let H;
  var L = pt(D);
  let I;
  var U = pt(L), q = pt(U, !0);
  ht(U), vr(U, (N) => A(y, N), () => d(y)), ht(L), vr(L, (N) => A(p, N), () => d(p)), ht(D), vr(D, (N) => A(w, N), () => d(w)), Lt(
    (N, B) => {
      H = dr(D, "", H, N), I = dr(L, "", I, B), re(q, d(x));
    },
    [
      () => ({
        "--offset-bottom": s.horizontalScrollbarHeight + "px",
        "--width": s.verticalScrollbarWidth + "px"
      }),
      () => ({
        "--pill-height": i.pillHeight + "px"
      })
    ]
  ), Kr(U, "clientHeight", (N) => i.labelHeight = N), Kr(D, "clientHeight", (N) => i.elementHeight = N), nt(o, D), It();
}
pe(["pointerdown", "pointermove", "pointerup"]);
var p_ = /* @__PURE__ */ dt('<a target="_blank"> </a>'), m_ = /* @__PURE__ */ dt('<div class="link-content"><!></div>');
const w_ = { hash: "svelte-3kpd", code: "" };
function y_(o, e) {
  Dt(e, !0), Ot(o, w_);
  let i = fi(e, "height");
  var u = m_(), s = pt(u);
  {
    var c = (v) => {
      var w = p_(), p = pt(w, !0);
      ht(w), Lt(() => {
        po(w, "href", e.url), re(p, e.url);
      }), nt(v, w);
    };
    xr(s, (v) => {
      e.url && v(c);
    });
  }
  ht(u), Kr(u, "clientHeight", i), nt(o, u), It();
}
var b_ = /* @__PURE__ */ dt('<div class="number-content svelte-rqpfez"> </div>');
const __ = {
  hash: "svelte-rqpfez",
  code: ".number-content.svelte-rqpfez {text-align:right;text-overflow:ellipsis;white-space:nowrap;overflow:hidden;}"
};
function x_(o, e) {
  Dt(e, !0), Ot(o, __);
  let i = fi(e, "height");
  function u(v) {
    return v === null ? null : Number.isInteger(v) ? v.toString() : v.toPrecision(4).toString();
  }
  var s = b_(), c = pt(s, !0);
  ht(s), Lt((v) => re(c, v), [() => u(e.number)]), Kr(s, "clientHeight", i), nt(o, s), It();
}
var R_ = /* @__PURE__ */ dt("<div> </div>");
const C_ = {
  hash: "svelte-122k9kr",
  code: ".clamped.svelte-122k9kr {display:-webkit-box;-webkit-box-orient:vertical;line-clamp:var(--lines, var(--num-lines)); /* fallback to numlines from parent */-webkit-line-clamp:var(--lines, var(--num-lines));overflow:hidden;text-overflow:ellipsis;}"
};
function mf(o, e) {
  Dt(e, !0), Ot(o, C_);
  let i = fi(e, "height");
  const u = bt.config;
  let s = /* @__PURE__ */ F(null), c = /* @__PURE__ */ F(null);
  Pt(() => {
    d(s) && (i(d(s).scrollHeight), A(c, Math.floor(e.parentHeight / u.lineHeight), !0));
  });
  var v = R_();
  let w;
  var p = pt(v, !0);
  ht(v), vr(v, (y) => A(s, y), () => d(s)), Lt(
    (y) => {
      Ae(v, 1, `text-content ${(e.clamped ? "clamped" : null) ?? ""}`, "svelte-122k9kr"), w = dr(v, "", w, y), re(p, e.text);
    },
    [() => ({ "--lines": d(c) })]
  ), nt(o, v), It();
}
class k_ {
  #t = /* @__PURE__ */ F(Zt({}));
  get config() {
    return d(this.#t);
  }
  set config(e) {
    A(this.#t, e, !0);
  }
}
const pu = "custom-cells";
class ao {
  static initialize() {
    Mr(pu, new k_());
  }
  static set config(e) {
    const i = fr(pu);
    i.config = e;
  }
  static get config() {
    return fr(pu).config;
  }
}
var S_ = /* @__PURE__ */ dt('<div class="bigint-content svelte-35i9ld"> </div>');
const z_ = {
  hash: "svelte-35i9ld",
  code: ".bigint-content.svelte-35i9ld {text-align:right;text-overflow:ellipsis;white-space:nowrap;overflow:hidden;}"
};
function P_(o, e) {
  Dt(e, !0), Ot(o, z_);
  let i = fi(e, "height");
  function u(v) {
    return v === null ? null : v.toLocaleString();
  }
  var s = S_(), c = pt(s, !0);
  ht(s), Lt((v) => re(c, v), [() => u(e.bigint)]), Kr(s, "clientHeight", i), nt(o, s), It();
}
var E_ = /* @__PURE__ */ dt("<div></div>");
const j_ = { hash: "svelte-3kpd", code: "" };
function A_(o, e) {
  Dt(e, !0), Ot(o, j_);
  let i = fi(e, "height");
  const u = yt.model, s = (y) => typeof y == "function" ? (x, S) => {
    let z = new y(x, S);
    return {
      ...z.update ? { update: z.update.bind(z) } : {},
      ...z.destroy ? { destroy: z.destroy.bind(z) } : {}
    };
  } : (x, S) => {
    let z = new y.class(x, S);
    return {
      ...z.update ? { update: z.update.bind(z) } : {},
      ...z.destroy ? { destroy: z.destroy.bind(z) } : {}
    };
  };
  let c = /* @__PURE__ */ M(() => s(e.customCell)), v = /* @__PURE__ */ M(() => u.getContent({ row: e.row, col: e.col })), w = /* @__PURE__ */ M(() => u.getRowData(e.row));
  var p = E_();
  Gu(p, (y, x) => d(c)?.(y, x), () => ({ value: d(v), rowData: d(w) })), ci(() => Kr(p, "clientHeight", i)), nt(o, p), It();
}
var O_ = (o, e, i, u, s) => {
  e.addHeightToRow(i.row, d(u) - d(s));
}, H_ = /* @__PURE__ */ dt("<button>↘</button>"), M_ = /* @__PURE__ */ dt('<div class="cell-content clamp svelte-ix87lc"><!> <!></div>');
const D_ = {
  hash: "svelte-ix87lc",
  code: ".cell-content.svelte-ix87lc {position:relative;flex-grow:1;line-height:var(--lineHeight);overflow-wrap:anywhere;overflow:hidden;}.expand-button.svelte-ix87lc {all:unset;visibility:hidden;position:absolute;bottom:0;right:0;cursor:pointer;font-size:12px;line-height:18px;padding-left:4px;padding-right:4px;border-radius:2px;color:var(--secondary-text-color);background-color:var(--background-color);border:var(--outline);}.expand-button.show.svelte-ix87lc {visibility:visible;}"
};
function I_(o, e) {
  Dt(e, !0), Ot(o, D_);
  const i = yt.model, u = yt.controller, s = yt.schema, c = bt.config, v = ao.config;
  let w = /* @__PURE__ */ F(0), p = /* @__PURE__ */ F(0), y = /* @__PURE__ */ M(() => d(p) > d(w));
  const x = i.getContent({ row: e.row, col: e.col }), S = s.dataType[e.col] ?? "string", z = s.sqlType[e.col] ?? "TEXT";
  var E = M_();
  let k;
  var D = pt(E);
  {
    var H = (q) => {
      A_(q, {
        get row() {
          return e.row;
        },
        get col() {
          return e.col;
        },
        get customCell() {
          return v[e.col];
        },
        get height() {
          return d(p);
        },
        set height(N) {
          A(p, N, !0);
        }
      });
    }, L = (q) => {
      var N = mn(), B = Dr(N);
      {
        var T = (it) => {
          var kt = mn(), Tt = Dr(kt);
          {
            var Et = (rt) => {
              y_(rt, {
                get url() {
                  return x;
                },
                get height() {
                  return d(p);
                },
                set height(mt) {
                  A(p, mt, !0);
                }
              });
            }, at = (rt) => {
              mf(rt, {
                get text() {
                  return x;
                },
                get clamped() {
                  return d(y);
                },
                get parentHeight() {
                  return d(w);
                },
                get height() {
                  return d(p);
                },
                set height(mt) {
                  A(p, mt, !0);
                }
              });
            };
            xr(Tt, (rt) => {
              x && x.startsWith("http") ? rt(Et) : rt(at, !1);
            });
          }
          nt(it, kt);
        }, ct = (it) => {
          var kt = mn(), Tt = Dr(kt);
          {
            var Et = (rt) => {
              var mt = mn(), Qt = Dr(mt);
              {
                var qt = (Kt) => {
                  {
                    let Cr = /* @__PURE__ */ M(() => BigInt(x ?? ""));
                    P_(Kt, {
                      get bigint() {
                        return d(Cr);
                      },
                      get height() {
                        return d(p);
                      },
                      set height(Jt) {
                        A(p, Jt, !0);
                      }
                    });
                  }
                }, ir = (Kt) => {
                  x_(Kt, {
                    get number() {
                      return x;
                    },
                    get height() {
                      return d(p);
                    },
                    set height(Cr) {
                      A(p, Cr, !0);
                    }
                  });
                };
                xr(Qt, (Kt) => {
                  z === "BIGINT" ? Kt(qt) : Kt(ir, !1);
                });
              }
              nt(rt, mt);
            }, at = (rt) => {
              mf(rt, {
                get text() {
                  return x;
                },
                get clamped() {
                  return d(y);
                },
                get parentHeight() {
                  return d(w);
                },
                get height() {
                  return d(p);
                },
                set height(mt) {
                  A(p, mt, !0);
                }
              });
            };
            xr(
              Tt,
              (rt) => {
                S === "number" ? rt(Et) : rt(at, !1);
              },
              !0
            );
          }
          nt(it, kt);
        };
        xr(
          B,
          (it) => {
            S === "string" ? it(T) : it(ct, !1);
          },
          !0
        );
      }
      nt(q, N);
    };
    xr(D, (q) => {
      v[e.col] ? q(H) : q(L, !1);
    });
  }
  var I = Ir(D, 2);
  {
    var U = (q) => {
      var N = H_();
      N.__click = [O_, u, e, p, w], Lt(() => Ae(N, 1, `expand-button ${e.hovered ? "show" : "hide"}`, "svelte-ix87lc")), nt(q, N);
    };
    xr(I, (q) => {
      d(y) && q(U);
    });
  }
  ht(E), Lt((q) => k = dr(E, "", k, q), [
    () => ({
      "--lineHeight": c.lineHeight + "px",
      "--num-lines": c.textMaxLines
    })
  ]), Kr(E, "clientHeight", (q) => A(w, q)), nt(o, E), It();
}
pe(["click"]);
var W_ = /* @__PURE__ */ dt('<div class="row-number svelte-er2yqb"> </div>');
const L_ = {
  hash: "svelte-er2yqb",
  code: ".row-number.svelte-er2yqb {flex-grow:1;text-align:right;color:var(--secondary-text-color);text-overflow:ellipsis;white-space:nowrap;overflow:hidden;}"
};
function T_(o, e) {
  Dt(e, !0), Ot(o, L_);
  const i = yt.model.getContent({ row: e.row, col: e.col }), u = /* @__PURE__ */ M(() => new Intl.NumberFormat().format(i ?? 0));
  var s = W_(), c = pt(s, !0);
  ht(s), Lt(() => re(c, d(u))), nt(o, s), It();
}
var N_ = (o, e) => {
  o.key === "Enter" && e();
}, $_ = /* @__PURE__ */ dt('<div class="cell svelte-1e1vbvn"><!></div>');
const q_ = {
  hash: "svelte-1e1vbvn",
  code: ".cell.svelte-1e1vbvn {--x: 0px;--y: 0px;--width: 0px;--height: 0px;display:flex;box-sizing:border-box;padding-top:calc(var(--padding-y) / 2);padding-bottom:calc(var(--padding-y) / 2);padding-right:calc(calc(var(--padding-x) / 2) + var(--extra-right-padding));padding-left:calc(calc(var(--padding-x) / 2) + var(--extra-left-padding));position:absolute;left:0;top:0;width:var(--width);height:var(--height);transform:translate(var(--x), var(--y));contain:layout paint;color:var(--primary-text-color);font-family:var(--cell-font-family);font-size:var(--cell-font-size);}"
};
function F_(o, e) {
  Dt(e, !0), Ot(o, q_);
  const i = yt.model, u = yt.controller, s = yt.overscrollModifier, c = bt.config;
  let v = /* @__PURE__ */ M(() => i.getPosition({ row: e.row, col: e.col })), w = /* @__PURE__ */ M(() => d(v).x), p = /* @__PURE__ */ M(() => d(v).y), y = /* @__PURE__ */ M(() => s.y(d(p))), x = /* @__PURE__ */ M(() => i.getDimensions({ row: e.row, col: e.col })), S = /* @__PURE__ */ M(() => d(x).width), z = /* @__PURE__ */ M(() => d(x).height), E = /* @__PURE__ */ M(() => i.isFirstCol(e.col)), k = /* @__PURE__ */ M(() => i.isLastCol(e.col)), D = /* @__PURE__ */ M(() => i.getRowParity(e.row) === "even" ? "var(--primary-bg)" : "var(--secondary-bg)"), H = () => {
    c.onRowClick && c.onRowClick(e.row);
  }, L = /* @__PURE__ */ F(!1);
  var I = $_();
  I.__click = H, I.__keydown = [N_, H];
  let U;
  var q = pt(I);
  {
    var N = (T) => {
      I_(T, {
        get row() {
          return e.row;
        },
        get col() {
          return e.col;
        },
        get hovered() {
          return d(L);
        }
      });
    }, B = (T) => {
      T_(T, {
        get row() {
          return e.row;
        },
        get col() {
          return e.col;
        }
      });
    };
    xr(q, (T) => {
      e.col !== sr ? T(N) : T(B, !1);
    });
  }
  ht(I), Lt((T) => U = dr(I, "", U, T), [
    () => ({
      "--x": d(w) + "px",
      "--y": d(y) + "px",
      "--width": d(S) + "px",
      "--height": d(z) + "px",
      "--padding-x": c.betweenColPadding + "px",
      "--padding-y": c.betweenRowPadding + "px",
      "--extra-right-padding": (d(k) ? c.verticalScrollbarWidth : 0) + "px",
      "--extra-left-padding": (d(E) ? c.firstColLeftPadding : 0) + "px",
      "--background-color": d(D)
    })
  ]), li("pointerenter", I, () => {
    A(L, !0), u.hoveredRowId = e.row;
  }), li("pointerleave", I, () => {
    A(L, !1), u.hoveredRowId = null;
  }), nt(o, I), It();
}
pe(["click", "keydown"]);
var B_ = /* @__PURE__ */ dt('<div class="header-title svelte-1wng68q"> </div>');
const U_ = {
  hash: "svelte-1wng68q",
  code: ".header-title.svelte-1wng68q {flex-shrink:1;margin-right:2px;}"
};
function X_(o, e) {
  Dt(e, !0), Ot(o, U_);
  const i = bt.config;
  var u = B_(), s = pt(u, !0);
  ht(u), Lt(() => re(s, i.columnConfigs[e.col]?.title ?? e.col)), nt(o, u), It();
}
jy();
var K_ = /* @__PURE__ */ dt('<div class="row-number-header svelte-1cjtpqh">#</div>');
const G_ = {
  hash: "svelte-1cjtpqh",
  code: ".row-number-header.svelte-1cjtpqh {flex-grow:1;text-align:right;margin-right:4px;box-sizing:border-box;color:var(--secondary-text-color);}"
};
function V_(o) {
  Ot(o, G_);
  var e = K_();
  nt(o, e);
}
var Y_ = (o, e, i, u, s) => {
  const c = d(e) ? d(i) === "ascending" ? "descending" : null : "ascending";
  c ? u.handleSort({ column: s.col, direction: c }) : u.handleSort(null);
}, Z_ = /* @__PURE__ */ dt('<button class="sort-buttons svelte-3f09kb"><div> </div></button>');
const Q_ = {
  hash: "svelte-3f09kb",
  code: ".sort-buttons.svelte-3f09kb {all:unset;flex-shrink:0;width:16px;cursor:pointer;display:flex;justify-content:center;flex-direction:row;margin-left:4px;border-radius:2px;padding-left:4px;padding-right:4px;color:var(--tertiary-text-color);}.sort-buttons.svelte-3f09kb:hover {--placeholder: 0;background-color:var(--hover-bg);}.sort-glyph.svelte-3f09kb {color:var(--tertiary-text-color);}.sort-buttons.svelte-3f09kb:hover .sort-glyph:where(.svelte-3f09kb) {color:var(--tertiary-text-color);}.selected.svelte-3f09kb {color:var(--primary-text-color) !important;}"
};
function J_(o, e) {
  Dt(e, !0), Ot(o, Q_);
  const i = yt.controller;
  let u = /* @__PURE__ */ M(() => i.sort ? i.sort.column === e.col : !1), s = /* @__PURE__ */ M(() => i.sort ? i.sort.direction : null), c = /* @__PURE__ */ M(() => d(u) ? d(s) === "ascending" ? "↑" : "↓" : "⇅");
  var v = Z_();
  v.__click = [Y_, u, s, i, e];
  var w = pt(v), p = pt(w, !0);
  ht(w), ht(v), Lt(() => {
    Ae(w, 1, `sort-button ${(d(u) ? "selected" : null) ?? ""} sort-glyph`, "svelte-3f09kb"), re(p, d(c));
  }), nt(o, v), It();
}
pe(["click"]);
class t1 {
  #t = /* @__PURE__ */ F(Zt({}));
  get config() {
    return d(this.#t);
  }
  set config(e) {
    A(this.#t, e, !0);
  }
}
const mu = "custom-cells";
class Pu {
  static initialize() {
    Mr(mu, new t1());
  }
  static set config(e) {
    const i = fr(mu);
    i.config = e;
  }
  static get config() {
    return fr(mu).config;
  }
}
var r1 = /* @__PURE__ */ dt("<div></div>");
const e1 = { hash: "svelte-3kpd", code: "" };
function n1(o, e) {
  Dt(e, !0), Ot(o, e1), yt.model;
  const i = (c) => typeof c == "function" ? (v, w) => {
    let p = new c(v, w);
    return {
      ...p.update ? { update: p.update.bind(p) } : {},
      ...p.destroy ? { destroy: p.destroy.bind(p) } : {}
    };
  } : (v, w) => {
    let p = new c.class(v, w);
    return {
      ...p.update ? { update: p.update.bind(p) } : {},
      ...p.destroy ? { destroy: p.destroy.bind(p) } : {}
    };
  };
  let u = /* @__PURE__ */ M(() => i(e.customHeader));
  var s = r1();
  Gu(s, (c, v) => d(u)?.(c, v), () => ({ column: e.col })), nt(o, s), It();
}
var i1 = /* @__PURE__ */ dt("<!> <!>", 1), o1 = /* @__PURE__ */ dt('<div><div class="header-content svelte-12avjxu"><!> <div class="header-title svelte-12avjxu"><!></div></div></div>');
const l1 = {
  hash: "svelte-12avjxu",
  code: ".header-cell.svelte-12avjxu {position:relative;display:flex;flex-direction:row;align-items:end;width:var(--width);min-height:var(--height);flex-shrink:0;box-sizing:border-box;padding:0.25em;padding-right:calc(calc(var(--padding-x) / 2) + var(--extra-padding-right));padding-left:calc(calc(var(--padding-x) / 2) + var(--extra-padding-left));color:var(--secondary-text-color);font-family:var(--header-font-family);font-size:var(--header-font-size);}.header-cell.number.svelte-12avjxu {justify-content:end;}.header-content.svelte-12avjxu {display:flex;flex-direction:column;flex-shrink:0;}.header-title.svelte-12avjxu {height:1.5em;align-items:center;display:flex;flex-direction:row;flex-shrink:0;}"
};
function u1(o, e) {
  Dt(e, !0), Ot(o, l1);
  const i = yt.model, u = yt.schema, s = bt.config, c = Pu.config;
  let v = /* @__PURE__ */ F(null), w = /* @__PURE__ */ F(0);
  Pt(() => {
    s.minColumnWidths[e.col] = d(w) + s.betweenColPadding;
  });
  const p = /* @__PURE__ */ M(() => i.colWidths[e.col]), y = /* @__PURE__ */ M(() => (u.dataType[e.col] ?? "string") === "number"), x = /* @__PURE__ */ M(() => d(y) || e.col === sr ? "number" : ""), S = /* @__PURE__ */ M(() => i.isFirstCol(e.col)), z = /* @__PURE__ */ M(() => i.isLastCol(e.col));
  let E = /* @__PURE__ */ M(() => s.headerHeight ? s.headerHeight + "px" : "auto");
  var k = o1();
  let D;
  var H = pt(k), L = pt(H);
  {
    var I = (T) => {
      n1(T, {
        get col() {
          return e.col;
        },
        get customHeader() {
          return c[e.col];
        }
      });
    };
    xr(L, (T) => {
      c[e.col] && T(I);
    });
  }
  var U = Ir(L, 2), q = pt(U);
  {
    var N = (T) => {
      var ct = i1(), it = Dr(ct);
      X_(it, {
        get col() {
          return e.col;
        }
      });
      var kt = Ir(it, 2);
      J_(kt, {
        get col() {
          return e.col;
        }
      }), nt(T, ct);
    }, B = (T) => {
      V_(T);
    };
    xr(q, (T) => {
      e.col !== sr ? T(N) : T(B, !1);
    });
  }
  ht(U), ht(H), ht(k), vr(k, (T) => A(v, T), () => d(v)), Lt(
    (T) => {
      Ae(k, 1, `header-cell ${d(x) ?? ""}`, "svelte-12avjxu"), D = dr(k, "", D, T);
    },
    [
      () => ({
        "--width": d(p) + "px",
        "--height": d(E),
        "--padding-x": s.betweenColPadding + "px",
        "--extra-padding-right": (d(z) ? s.verticalScrollbarWidth : 0) + "px",
        "--extra-padding-left": (d(S) ? s.firstColLeftPadding : 0) + "px"
      })
    ]
  ), Kr(H, "clientWidth", (T) => A(w, T)), nt(o, k), It();
}
class a1 {
  tableModel;
  tableController;
  col;
  config;
  isDragging = !1;
  startDragX = 0;
  constructor({ tableModel: e, tableController: i, col: u }) {
    this.tableModel = e, this.tableController = i, this.col = u, this.config = bt.config;
  }
  handlePointerDown = (e) => {
    e.preventDefault(), e.target.setPointerCapture(e.pointerId), this.isDragging = !0, this.startDragX = e.offsetX;
  };
  handlePointerMove = (e) => {
    if (this.isDragging && this.startDragX !== null) {
      const i = e.offsetX - this.startDragX, u = this.tableModel.colWidths[this.col], s = Math.max(0, Math.round(u + i));
      this.config.columnConfigs[this.col] || (this.config.columnConfigs[this.col] = {}), this.config.columnConfigs[this.col].width = s, this.config.onColumnConfigsChange(this.col, Of(this.config.columnConfigs));
    }
  };
  handlePointerUp = (e) => {
    e.target.releasePointerCapture(e.pointerId), this.isDragging = !1, this.startDragX = null;
  };
}
var s1 = /* @__PURE__ */ dt('<div class="header-resize-indicator svelte-1v734te"><div class="pill svelte-1v734te"></div></div>');
const c1 = {
  hash: "svelte-1v734te",
  code: ".header-resize-indicator.svelte-1v734te {position:absolute;z-index:2;box-sizing:border-box;width:12px;height:calc(100% - 0.25rem);margin:2px;cursor:col-resize;justify-content:center;display:flex;align-items:center;justify-content:center;transform:translateX(calc(var(--x) - 4px - 50%));}.pill.svelte-1v734te {width:2px;height:calc(100% - 4px);margin-top:2px;margin-bottom:2px;background-color:var(--secondary-text-color);opacity:0.2;border-radius:2px;}"
};
function f1(o, e) {
  Dt(e, !0), Ot(o, c1);
  const i = yt.model;
  let u = new a1({
    tableModel: i,
    tableController: yt.controller,
    col: e.col
  });
  const s = /* @__PURE__ */ M(() => i.colPositions[e.col] + i.colWidths[e.col]);
  var c = s1();
  c.__pointerdown = function(...w) {
    u.handlePointerDown?.apply(this, w);
  }, c.__pointermove = function(...w) {
    u.handlePointerMove?.apply(this, w);
  }, c.__pointerup = function(...w) {
    u.handlePointerUp?.apply(this, w);
  };
  let v;
  Lt((w) => v = dr(c, "", v, w), [() => ({ "--x": d(s) + "px" })]), nt(o, c), It();
}
pe(["pointerdown", "pointermove", "pointerup"]);
var h1 = (o) => {
  o.stopPropagation();
}, v1 = /* @__PURE__ */ dt('<div class="table-portal svelte-1qnjihj" tabindex="-1"><!></div>');
const d1 = {
  hash: "svelte-1qnjihj",
  code: ".table-portal.svelte-1qnjihj {position:absolute;}"
};
function g1(o, e) {
  Dt(e, !0), Ot(o, d1);
  const i = yt.controller, u = yt.tablePortalController;
  let s = /* @__PURE__ */ F(null);
  const c = (x) => {
    Pt(() => (u.mount(x, e.relativeTo, e.anchor, e.horizontalAlign, e.verticalAlign), x.focus(), () => {
      u.destroy(x);
    }));
  };
  let v = 0;
  kn(() => {
    v = i.xScroll, requestAnimationFrame(w);
  });
  function w() {
    d(s) && e.stickyX && (d(s).style.transform = `translateX(${i.xScroll - v}px)`), requestAnimationFrame(w);
  }
  var p = v1();
  p.__click = [h1];
  var y = pt(p);
  Ku(y, () => e.children), ht(p), vr(p, (x) => A(s, x), () => d(s)), Gu(p, (x) => c?.(x)), li(
    "wheel",
    p,
    // dont let clicks bubble up
    (x) => {
      x.stopPropagation();
    }
  ), nt(o, p), It();
}
pe(["click"]);
var p1 = (o, e) => {
  A(e, !0);
}, m1 = /* @__PURE__ */ dt("<button> </button> <!>", 1);
const w1 = {
  hash: "svelte-8ns8fr",
  code: '.dropdown.svelte-8ns8fr {all:unset;padding-left:8px;padding-right:8px;border-radius:2px;cursor:pointer;color:var(--secondary-text-color);position:relative;user-select:none;}.dropdown.svelte-8ns8fr::before {content:"";position:absolute;top:0;left:0;height:100%;width:100%;background-color:var(--primary-bg);z-index:-1;}.dropdown.svelte-8ns8fr:hover {background-color:var(--hover-bg);}.unclickable.svelte-8ns8fr {pointer-events:none;}'
};
function y1(o, e) {
  Ot(o, w1);
  let i = /* @__PURE__ */ F(!1), u = /* @__PURE__ */ F(null), s = /* @__PURE__ */ F(null);
  var c = m1();
  li("click", bu, (x) => {
    d(i) && x.target !== d(u) && A(i, !1);
  });
  var v = Dr(c);
  v.__click = [p1, i];
  var w = pt(v, !0);
  ht(v), vr(v, (x) => A(u, x), () => d(u));
  var p = Ir(v, 2);
  {
    var y = (x) => {
      g1(x, {
        get relativeTo() {
          return e.relativeTo;
        },
        anchor: "outside",
        horizontalAlign: "left",
        verticalAlign: "top",
        stickyX: !1,
        get element() {
          return d(s);
        },
        set element(S) {
          A(s, S, !0);
        },
        children: (S, z) => {
          var E = mn(), k = Dr(E);
          Ku(k, () => e.children), nt(S, E);
        },
        $$slots: { default: !0 }
      });
    };
    xr(p, (x) => {
      d(i) && x(y);
    });
  }
  Lt(() => {
    Ae(v, 1, `dropdown ${d(i) ? "unclickable" : "clickable"}`, "svelte-8ns8fr"), re(w, e.label);
  }), nt(o, c);
}
pe(["click"]);
var b1 = (o, e, i) => {
  o.target.checked ? e.showColumn(d(i)) : e.hideColumn(d(i));
}, _1 = /* @__PURE__ */ dt('<li class="column-entry svelte-def7zm"><label class="column-label svelte-def7zm"> <input type="checkbox"/></label></li>'), x1 = /* @__PURE__ */ dt('<ul class="column-toggle svelte-def7zm"></ul>'), R1 = /* @__PURE__ */ dt("<!> <!>", 1), C1 = /* @__PURE__ */ dt('<div class="header-row svelte-def7zm"><div class="scroll-container svelte-def7zm"><div class="dropdown-label-container svelte-def7zm"><div class="dropdown-label svelte-def7zm"><!></div></div> <!></div></div>');
const k1 = {
  hash: "svelte-def7zm",
  code: ".header-row.svelte-def7zm {flex-shrink:0;border-bottom:1px solid var(--secondary-bg);background-color:var(--primary-bg);}.scroll-container.svelte-def7zm {display:flex;flex-direction:row;}.dropdown-label-container.svelte-def7zm {position:absolute;z-index:20;left:0px;box-sizing:border-box;height:100%;padding:0.25em;display:flex;flex-direction:row;align-items:end;}.dropdown-label.svelte-def7zm {height:1.5em;align-items:center;display:flex;}.column-toggle.svelte-def7zm {margin:0;margin-top:4px;margin-left:8px;padding:12px;background-color:var(--primary-bg);border-radius:4px;box-shadow:var(--shadow);border:var(--outline);max-height:var(--max-height);max-width:var(--max-width);overflow:scroll;}.column-entry.svelte-def7zm {list-style-type:none;padding:4px;user-select:none;}.column-label.svelte-def7zm {display:flex;align-items:center;justify-content:space-between;gap:16px;color:var(--secondary-text-color);}"
};
function S1(o, e) {
  Dt(e, !0), Ot(o, k1);
  const i = yt.model, u = yt.controller, s = bt.config;
  let c = /* @__PURE__ */ F(null), v = /* @__PURE__ */ F(null), w = /* @__PURE__ */ F(null), p = /* @__PURE__ */ M(() => i.renderableCols), y = 0;
  kn(() => (y = requestAnimationFrame(x), () => {
    cancelAnimationFrame(y);
  }));
  function x() {
    d(v) && (d(v).style.transform = `translate3d(${u.xScroll}px, 0, 0)`), d(w) && (d(w).style.transform = `translate3d(${-u.xScroll}px, 0, 0)`), y = requestAnimationFrame(x);
  }
  var S = C1(), z = pt(S), E = pt(z), k = pt(E), D = pt(k);
  y1(D, {
    label: "⋮",
    get relativeTo() {
      return d(c);
    },
    children: (L, I) => {
      var U = x1();
      let q;
      Jn(U, 21, () => i.columns, bb, (N, B) => {
        var T = _1(), ct = pt(T), it = pt(ct), kt = Ir(it);
        Pb(kt), kt.__change = [b1, u, B], dr(kt, "", {}, { float: "right" }), ht(ct), ht(T), Lt(() => {
          re(it, `${(d(B) === sr ? "row #" : s.columnConfigs[d(B)]?.title ?? d(B)) ?? ""} `), po(kt, "id", `${d(B) ?? ""}-checkbox`), Eb(kt, d(B) === sr ? s.showRowNumber !== !1 : !s.columnConfigs[d(B)]?.hidden);
        }), nt(N, T);
      }), ht(U), Lt((N) => q = dr(U, "", q, N), [
        () => ({
          "--max-height": u.viewHeight - 48 + "px",
          "--max-width": u.viewWidth - 48 + "px"
        })
      ]), nt(L, U);
    }
  }), ht(k), vr(k, (L) => A(w, L), () => d(w)), ht(E);
  var H = Ir(E, 2);
  Jn(H, 16, () => d(p), (L) => L, (L, I) => {
    var U = R1(), q = Dr(U);
    u1(q, {
      get col() {
        return I;
      }
    });
    var N = Ir(q, 2);
    f1(N, {
      get col() {
        return I;
      }
    }), nt(L, U);
  }), ht(z), vr(z, (L) => A(v, L), () => d(v)), ht(S), vr(S, (L) => A(c, L), () => d(c)), nt(o, S), It();
}
pe(["change"]);
function z1(o, e) {
  return { ...o, ...o[e] != null ? o[e] : {} };
}
class P1 {
  #t = /* @__PURE__ */ F(null);
  get colorScheme() {
    return d(this.#t);
  }
  set colorScheme(e) {
    A(this.#t, e, !0);
  }
  #r = /* @__PURE__ */ F(Zt({}));
  get theme() {
    return d(this.#r);
  }
  set theme(e) {
    A(this.#r, e, !0);
  }
}
const wf = Symbol("style");
class Eu {
  static initialize() {
    Mr(wf, new P1());
  }
  static get style() {
    return fr(wf);
  }
}
var E1 = /* @__PURE__ */ dt("<div><!></div>");
const j1 = {
  hash: "svelte-vahitw",
  code: ".table-defaults.light.svelte-vahitw {--default-primary-text-color: black;--default-secondary-text-color: gray;--default-tertiary-text-color: lightgray;--default-font-family: sans-serif;--default-font-size: 1rem;--default-primary-bg: white;--default-secondary-bg: rgb(246, 246, 247);--default-tertiary-bg: rgb(234, 234, 235);--default-hover-bg: rgba(0, 0, 0, 0.05);--default-scrollbar-bg: rgba(0, 0, 0, 0.05);--default-scrollbar-pill-bg: rgba(0, 0, 0, 0.5);--default-scrollbar-label-bg: rgba(255, 255, 255, 0.9);--default-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);--default-outline-color: rgb(0 0 0 / 0.2);--default-dimmed-row-color: rgb(0 0 0 / 0.2);--default-row-scroll-to-color: rgb(202 225 255);--default-row-hover-color: rgb(220, 235, 255);}.table-defaults.dark.svelte-vahitw {--default-primary-text-color: lightgray;--default-secondary-text-color: gray;--default-tertiary-text-color: dimgray;--default-font-family: sans-serif;--default-font-size: 1rem;--default-primary-bg: #060607;--default-secondary-bg: #161617;--default-hover-bg: rgba(255, 255, 255, 0.05);--default-scrollbar-bg: rgba(255, 255, 255, 0.05);--default-scrollbar-pill-bg: rgba(255, 255, 255, 0.5);--default-scrollbar-label-bg: rgba(0, 0, 0, 0.9);--default-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);--default-outline-color: rgb(255 255 255 / 0.2);--default-dimmed-row-color: rgb(0 0 0 / 0.6);--default-row-scroll-to-color: rgb(1, 24, 106);--default-row-hover-color: rgb(0, 6, 35);}.style-wrapper.svelte-vahitw {width:100%;height:100%;--primary-text-color: var(--user-primary-text-color, var(--default-primary-text-color));--secondary-text-color: var(--user-secondary-text-color, var(--default-secondary-text-color));--tertiary-text-color: var(--user-tertiary-text-color, var(--default-tertiary-text-color));--font-family: var(--user-font-family, var(--default-font-family));--font-size: var(--user-font-size, var(--default-font-size));--primary-bg: var(--user-primary-bg, var(--default-primary-bg));--secondary-bg: var(--user-secondary-bg, var(--default-secondary-bg));--tertiary-bg: var(--user-tertiarty-bg, var(--default-tertiary-bg));--hover-bg: var(--user-hover-bg, var(--default-hover-bg));--header-font-family: var(--user-header-font-family, var(--font-family));--header-font-size: var(--user-header-font-size, var(--font-size));--cell-font-family: var(--user-cell-font-family, var(--font-family));--cell-font-size: var(--user-cell-font-size, var(--font-size));--scrollbar-bg: var(--user-scrollbar-bg, var(--default-scrollbar-bg));--scrollbar-pill-bg: var(--user-scrollbar-pill-bg, var(--default-scrollbar-pill-bg));--scrollbar-label-bg: var(--user-scrollbar-label-bg, var(--default-scrollbar-label-bg));--shadow: var(--user-shadow, var(--default-shadow));--outline-color: var(--user-outline-color, var(--default-outline-color));--outline: 0.5px solid var(--outline-color);--dimmed-row-color: var(--user-dimmed-row-color, var(--default-dimmed-row-color));--row-scroll-to-color: var(--user-row-scroll-to-color, var(--default-row-scroll-to-color));--row-hover-color: var(--user-row-hover-color, var(--default-row-hover-color));}"
};
function A1(o, e) {
  Dt(e, !0), Ot(o, j1);
  const i = Eu.style;
  let u = /* @__PURE__ */ M(() => i.colorScheme), s = /* @__PURE__ */ M(() => i.theme), c = /* @__PURE__ */ F(null), v = /* @__PURE__ */ M(() => d(u) ?? d(c) ?? "light");
  const w = (qt) => {
    qt.matches ? A(c, "dark") : A(c, "light");
  }, p = "(prefers-color-scheme: dark";
  kn(() => (A(c, window.matchMedia(p).matches ? "dark" : "light", !0), window.matchMedia(p).addEventListener("change", w), () => {
    window.matchMedia(p).removeEventListener("change", w);
  }));
  let y = /* @__PURE__ */ M(() => z1(d(s), d(v))), x = /* @__PURE__ */ M(() => d(y).primaryTextColor), S = /* @__PURE__ */ M(() => d(y).secondaryTextColor), z = /* @__PURE__ */ M(() => d(y).tertiaryTextColor), E = /* @__PURE__ */ M(() => d(y).fontFamily), k = /* @__PURE__ */ M(() => d(y).fontSize), D = /* @__PURE__ */ M(() => d(y).primaryBackgroundColor), H = /* @__PURE__ */ M(() => d(y).secondaryBackgroundColor), L = /* @__PURE__ */ M(() => d(y).hoverBackgroundColor), I = /* @__PURE__ */ M(() => d(y).headerFontFamily), U = /* @__PURE__ */ M(() => d(y).headerFontSize), q = /* @__PURE__ */ M(() => d(y).cellFontFamily), N = /* @__PURE__ */ M(() => d(y).cellFontSize), B = /* @__PURE__ */ M(() => d(y).scrollbarBackgroundColor), T = /* @__PURE__ */ M(() => d(y).scrollbarPillColor), ct = /* @__PURE__ */ M(() => d(y).scrollbarLabelBackgroundColor), it = /* @__PURE__ */ M(() => d(y).shadow), kt = /* @__PURE__ */ M(() => d(y).outlineColor), Tt = /* @__PURE__ */ M(() => d(y).dimmedRowColor), Et = /* @__PURE__ */ M(() => d(y).rowScrollToColor), at = /* @__PURE__ */ M(() => d(y).rowHoverColor);
  Pt(() => {
  });
  var rt = E1();
  let mt;
  var Qt = pt(rt);
  Ku(Qt, () => e.children), ht(rt), Lt(
    (qt) => {
      Ae(rt, 1, `style-wrapper table-defaults ${d(v) ?? ""}`, "svelte-vahitw"), mt = dr(rt, "", mt, qt);
    },
    [
      () => ({
        "--user-primary-text-color": d(x),
        "--user-secondary-text-color": d(S),
        "--user-tertiary-text-color": d(z),
        "--user-font-family": d(E),
        "--user-font-size": d(k),
        "--user-primary-bg": d(D),
        "--user-secondary-bg": d(H),
        "--user-hover-bg": d(L),
        "--user-header-font-family": d(I),
        "--user-header-font-size": d(U),
        "--user-cell-font-family": d(q),
        "--user-cell-font-size": d(N),
        "--user-scrollbar-bg": d(B),
        "--user-scrollbar-pill-bg": d(T),
        "--user-scrollbar-label-bg": d(ct),
        "--user-shadow": d(it),
        "--user-outline-color": d(kt),
        "--user-dimmed-row-color": d(Tt),
        "--user-row-scroll-to-color": d(Et),
        "--user-row-hover-color": d(at)
      })
    ]
  ), nt(o, rt), It();
}
function O1() {
  return sr;
}
function H1(o, e) {
  const i = new Set(o), u = new Set(e);
  return {
    left: o.filter((s) => !u.has(s)),
    right: e.filter((s) => !i.has(s))
  };
}
function M1(o, e) {
  const i = new Set(e);
  return o.filter((u) => !i.has(u));
}
function D1(o, e) {
  return o.concat(e);
}
var I1 = /* @__PURE__ */ dt("<div></div>"), W1 = /* @__PURE__ */ dt("<div></div> <!>", 1);
const L1 = {
  hash: "svelte-h8fig9",
  code: ".row-background.svelte-h8fig9 {position:absolute;width:var(--width);height:var(--height);box-sizing:border-box;z-index:-1;transform:translate3d(0, var(--y), 0);transition:background-color 100ms linear;}.odd.svelte-h8fig9 {background-color:var(--secondary-bg);}.even.svelte-h8fig9 {background-color:var(--primary-bg);}.dimmer.svelte-h8fig9 {background-color:var(--dimmed-row-color);z-index:10;pointer-events:none;}.flashed.svelte-h8fig9 {background-color:var(--row-scroll-to-color);}.hovered.svelte-h8fig9 {background-color:var(--row-hover-color);}"
};
function T1(o, e) {
  Dt(e, !0), Ot(o, L1);
  const i = yt.controller, u = yt.model, s = yt.overscrollModifier, c = bt.config;
  let v = /* @__PURE__ */ M(() => u.rowHeights[e.row]), w = /* @__PURE__ */ M(() => Math.max(u.colsRightmostPosition, i.viewWidth)), p = /* @__PURE__ */ M(() => s.y(u.rowPositions[e.row])), y = /* @__PURE__ */ M(() => u.getRowParity(e.row)), x = /* @__PURE__ */ M(() => i.flashedRowId === e.row), S = /* @__PURE__ */ M(() => i.hoveredRowId === e.row), z = /* @__PURE__ */ M(() => c.highlightedRows ? c.highlightedRows?.has(e.row) : null);
  var E = W1(), k = Dr(E);
  let D;
  var H = Ir(k, 2);
  {
    var L = (I) => {
      var U = I1();
      let q;
      Lt(
        (N) => {
          Ae(U, 1, `row-background ${d(y) ?? ""} dimmer`, "svelte-h8fig9"), q = dr(U, "", q, N);
        },
        [
          () => ({
            "--width": d(w) + "px",
            "--height": d(v) + "px",
            "--y": d(p) + "px"
          })
        ]
      ), nt(I, U);
    };
    xr(H, (I) => {
      d(z) !== null && !d(z) && I(L);
    });
  }
  Lt(
    (I) => {
      Ae(k, 1, `row-background ${d(y) ?? ""} ${(d(x) ? "flashed" : null) ?? ""} ${(d(S) && c.highlightHoveredRow ? "hovered" : null) ?? ""}`, "svelte-h8fig9"), D = dr(k, "", D, I);
    },
    [
      () => ({
        "--width": d(w) + "px",
        "--height": d(v) + "px",
        "--y": d(p) + "px"
      })
    ]
  ), nt(o, E), It();
}
var N1 = /* @__PURE__ */ dt("<!> <!>", 1), $1 = /* @__PURE__ */ dt('<div class="scroll-container svelte-1q3xqdh"><!></div> <!> <!>', 1), q1 = /* @__PURE__ */ dt('<div class="table svelte-1q3xqdh"><!> <div class="table-contents svelte-1q3xqdh"><!></div></div>');
const F1 = {
  hash: "svelte-1q3xqdh",
  code: ".table.svelte-1q3xqdh {width:100%;max-width:var(--max-width);height:100%;display:flex;flex-direction:column;position:relative;}.table-contents.svelte-1q3xqdh {position:relative;overflow:hidden;flex-grow:1;}.scroll-container.svelte-1q3xqdh {position:absolute;width:0;height:0;will-change:transform;contain:layout size;}"
};
function B1(o, e) {
  Dt(e, !0), Ot(o, F1), bt.initialize(), ao.initialize(), Eu.initialize(), yt.initialize();
  const i = yt.controller, u = yt.model, s = yt.overscrollModifier, c = bt.config, v = Eu.style;
  Pt(() => {
    e.scrollTo != null && i.scrollToRow(String(e.scrollTo));
  }), Pt(() => {
    e.highlightedRows && e.highlightedRows.length > 0 ? c.highlightedRows = new Set(e.highlightedRows.map((I) => String(I))) : c.highlightedRows = null;
  }), Pt(() => {
    e.onRowClick != null ? c.onRowClick = e.onRowClick : c.onRowClick = null;
  }), Pt(() => {
    e.coordinator ? zu.coordinator = e.coordinator : zu.coordinator = null;
  }), Pt(() => {
    e.numLines != null ? c.textMaxLines = e.numLines : c.textMaxLines = c.DEFAULT_TEXT_MAX_LINES, e.lineHeight != null ? c.lineHeight = e.lineHeight : c.lineHeight = c.DEFAULT_LINE_HEIGHT;
  }), Pt(() => {
    e.colorScheme != null ? v.colorScheme = e.colorScheme : v.colorScheme = null;
  }), Pt(() => {
    e.theme != null ? v.theme = e.theme : v.theme = {}, e.colorScheme != null ? v.colorScheme = e.colorScheme : v.colorScheme = null;
  }), Pt(() => {
    e.columnConfigs != null ? c.columnConfigs = e.columnConfigs : c.columnConfigs = {}, e.onColumnConfigsChange != null ? c.onColumnConfigsChange = e.onColumnConfigsChange : c.onColumnConfigsChange = () => {
    };
  }), Pt(() => {
    c.showRowNumber = e.showRowNumber ?? null;
  }), Pt(() => {
    c.onShowRowNumberChange = e.onShowRowNumberChange ?? null;
  }), Pt(() => {
    i.initialize({
      tableName: e.table,
      rowKey: e.rowKey,
      columns: [O1(), ...e.columns],
      filterBy: e.filter ?? null
    });
  }), Pt(() => {
    e.customCells != null ? ao.config = e.customCells : ao.config = {};
  }), Pt(() => {
    e.additionalHeaderContents != null ? Pu.config = e.additionalHeaderContents : Pu.config = {};
  }), Pt(() => {
    e.headerHeight != null ? c.headerHeight = e.headerHeight : c.headerHeight = null;
  }), Pt(() => {
    e.highlightHoveredRow != null ? c.highlightHoveredRow = e.highlightHoveredRow : c.highlightHoveredRow = !1;
  });
  let w = /* @__PURE__ */ F([]), p = /* @__PURE__ */ F(0), y = /* @__PURE__ */ F(null), x = /* @__PURE__ */ F(Zt([])), S = /* @__PURE__ */ F(Zt([])), z = /* @__PURE__ */ M(() => d(x).filter((I) => i.rowStillExists(I))), E = /* @__PURE__ */ M(() => d(S)), k = 0;
  kn(() => (k = requestAnimationFrame(L), () => {
    i.teardown(), u.teardown(), cancelAnimationFrame(k);
  }));
  function D(I, U) {
    if (U.length > 0) {
      const q = U[U.length - 1];
      return Math.abs(u.data[I][cr] - u.data[q][cr]);
    }
    return 0;
  }
  function H() {
    const { left: I, right: U } = H1(d(w), u.renderableRows);
    I.length === 0 && U.length === 0 || (A(w, M1(d(
      w
      // remove the rows that have been deleted from the model
    ), I)), A(w, D1(d(
      w
      // add the rows that have been added by the model
    ), U.sort((q, N) => D(q, d(w)) - D(N, d(w))).slice(0, i.isJumping ? i.rowsOnScreen : c.rowRenderBatchSize))));
  }
  function L() {
    H(), A(x, d(w).filter((q) => i.rowIsVisible(q)), !0), A(S, u.renderableCols.filter((q) => i.colIsVisible(q)), !0);
    const I = i.xScroll, U = s.yScroll(i.yScroll);
    d(y) && (d(y).style.transform = `translate3d(${I}px, ${U}px, 0)`), A(p, i.updateKey, !0), k = requestAnimationFrame(L);
  }
  A1(o, {
    children: (I, U) => {
      var q = q1(), N = pt(q);
      S1(N, {});
      var B = Ir(N, 2), T = pt(B);
      {
        var ct = (it) => {
          var kt = $1(), Tt = Dr(kt), Et = pt(Tt);
          yb(Et, () => d(p), (mt) => {
            var Qt = N1(), qt = Dr(Qt);
            Jn(qt, 16, () => d(z), (Kt) => Kt, (Kt, Cr) => {
              var Jt = mn(), zo = Dr(Jt);
              Jn(zo, 16, () => d(E), (Sn) => Sn, (Sn, Po) => {
                F_(Sn, {
                  get row() {
                    return Cr;
                  },
                  get col() {
                    return Po;
                  }
                });
              }), nt(Kt, Jt);
            });
            var ir = Ir(qt, 2);
            Jn(ir, 16, () => u.renderableRows, (Kt) => Kt, (Kt, Cr) => {
              T1(Kt, {
                get row() {
                  return Cr;
                }
              });
            }), nt(mt, Qt);
          }), ht(Tt), vr(Tt, (mt) => A(y, mt), () => d(y));
          var at = Ir(Tt, 2);
          g_(at, {});
          var rt = Ir(at, 2);
          h_(rt, {}), nt(it, kt);
        };
        xr(T, (it) => {
          i.isReady && it(ct);
        });
      }
      ht(B), ht(q), vr(q, (it) => i.element = it, () => i?.element), li("wheel", q, function(...it) {
        i.handleWheel?.apply(this, it);
      }), Kr(B, "clientHeight", (it) => i.viewHeight = it), Kr(B, "clientWidth", (it) => i.viewWidth = it), nt(I, q);
    },
    $$slots: { default: !0 }
  }), It();
}
class K1 {
  component;
  currentProps;
  constructor(e, i) {
    this.currentProps = { ...i }, this.component = gb({ component: B1, target: e, props: i });
  }
  update(e) {
    let i = {};
    for (let u in e)
      e[u] !== this.currentProps[u] && (i[u] = e[u], this.currentProps[u] = e[u]);
    this.component.$set(i);
  }
  destroy() {
    this.component.$destroy();
  }
}
export {
  K1 as Z
};
