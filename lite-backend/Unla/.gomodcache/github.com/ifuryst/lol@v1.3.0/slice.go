/**
 * Package lol
 * @Author iFurySt <ifuryst@gmail.com>
 * @Date 2023/7/19
 */

package lol

import (
	"math/rand"
	"slices"
	"time"

	"golang.org/x/exp/constraints"
)

// SortSlice sorts a slice. Just a wrapper for slices.Sort.
func SortSlice[S ~[]E, E constraints.Ordered](s S) {
	slices.Sort(s)
}

// MergeSlice merges multiple slices without removing duplicates or shuffling the elements.
//
// Play: https://go.dev/play/p/ARhoTg83WK8
func MergeSlice[T any](ss ...[]T) []T {
	if len(ss) == 0 {
		return []T{}
	}
	size := 0
	for _, v := range ss {
		size += len(v)
	}

	if size == 0 {
		return []T{}
	}

	var res = make([]T, 0, size)
	for _, v := range ss {
		res = append(res, v...)
	}
	return res
}

// UniqSlice merges multiple slices with removing duplicates the elements.
//
// Play: https://go.dev/play/p/clvg0gFoBQs
func UniqSlice[T comparable](ss ...[]T) []T {
	if len(ss) == 0 {
		return []T{}
	}
	size := 0
	for _, v := range ss {
		size += len(v)
	}

	if size == 0 {
		return []T{}
	}

	var (
		res   = make([]T, 0, size)
		exist = make(map[T]struct{}, size)
	)
	for _, s := range ss {
		for _, v := range s {
			if _, ok := exist[v]; ok {
				continue
			}
			exist[v] = struct{}{}
			res = append(res, v)
		}
	}
	return res
}

// Union returns the union of multiple slices.
func Union[T comparable](ss ...[]T) []T {
	return UniqSlice[T](ss...)
}

// Intersection returns the intersection of multiple slices.
//
// Play: https://go.dev/play/p/tqI_pu_-khj
func Intersection[T comparable](ss ...[]T) []T {
	if len(ss) == 0 {
		return []T{}
	}
	var n, minL, maxL = len(ss), len(ss[0]), len(ss[0])
	for _, v := range ss {
		l := len(v)
		if l > maxL {
			maxL = l
		}
		if l < minL {
			minL = l
		}
	}
	if maxL == 0 {
		return []T{}
	}

	var (
		res   = make([]T, 0, minL)
		count = make(map[T]uint, maxL)
	)
	for _, s := range ss {
		for _, v := range s {
			count[v] += 1
			if count[v] == uint(n) {
				res = append(res, v)
			}
		}
	}
	return res
}

// Difference returns the difference of s1-s2.
//
// Play: https://go.dev/play/p/fB7HJFYbsCB
func Difference[T comparable](s1, s2 []T) []T {
	if len(s1) == 0 {
		return []T{}
	}
	if len(s2) == 0 {
		return s1
	}

	exist := make(map[T]struct{}, len(s2))
	for _, v := range s2 {
		exist[v] = struct{}{}
	}
	res := make([]T, 0, len(s1)/2)
	for _, v := range s1 {
		if _, ok := exist[v]; !ok {
			res = append(res, v)
		}
	}
	return res
}

type FindSliceDeltasOptions[T any, K comparable] struct {
	// Copy realizes deep copy, confirm the FindSliceDeltas return the new slice
	Copy func(T) T

	// Compare should return a negative number when a < b, a positive number when
	// a > b and zero when a == b.
	Compare func(a, b T) int
}

// FindSliceDeltas finds the added, removed, updated and unchanged items between s1 and s2.
// The key function is used to get the key of the item, and the equal function is used to compare the item.
// These two functions are required!
//
// The added, updated, unchanged slice will use s2's item, and the removed slice will use s1's item.
// if you provide the Copy function in FindSliceDeltasOptions,
// the all return slice will be copied through the Copy function.
//
// Play: https://go.dev/play/p/1-AFrP7CIGQ
func FindSliceDeltas[T any, K comparable](
	s1, s2 []T, key func(T) K,
	equal func(T, T) bool, options ...FindSliceDeltasOptions[T, K],
) (added, removed, updated, unchanged []T) {
	if key == nil || equal == nil {
		return nil, nil, nil, nil
	}

	capacity := max(len(s1), len(s2)) / 4
	added = make([]T, 0, capacity)
	removed = make([]T, 0, capacity)
	updated = make([]T, 0, capacity)
	unchanged = make([]T, 0, capacity)

	var option FindSliceDeltasOptions[T, K]
	if len(options) > 0 {
		option = options[0]
	}

	// key -> item
	m1 := make(map[K]T)
	m2 := make(map[K]T)
	for _, v := range s1 {
		m1[key(v)] = v
	}
	for _, v := range s2 {
		m2[key(v)] = v
	}

	// compare s1 and s2, find added, updated and unchanged items
	for k1, v2 := range m2 {
		v1, ok := m1[k1]
		if !ok {
			if option.Copy != nil {
				added = append(added, option.Copy(v2))
				continue
			}
			added = append(added, v2)
		} else if equal(v1, v2) {
			if option.Copy != nil {
				added = append(added, option.Copy(v2))
				continue
			}
			unchanged = append(unchanged, v2)
		} else {
			if option.Copy != nil {
				added = append(added, option.Copy(v2))
				continue
			}
			updated = append(updated, v2)
		}
	}

	// find removed items
	for k1, v1 := range m1 {
		if _, ok := m2[k1]; !ok {
			if option.Copy != nil {
				added = append(added, option.Copy(v1))
				continue
			}
			removed = append(removed, v1)
		}
	}

	if option.Compare != nil {
		slices.SortStableFunc(added, option.Compare)
		slices.SortStableFunc(removed, option.Compare)
		slices.SortStableFunc(updated, option.Compare)
		slices.SortStableFunc(unchanged, option.Compare)
	}

	return added, removed, updated, unchanged
}

// Map maps a function over a slice.
//
// Play: https://go.dev/play/p/ePBYrs1YqDz
func Map[T any](list []T, fn func(v T) T) []T {
	if len(list) == 0 {
		return []T{}
	}
	if fn == nil {
		return list
	}

	for i := range list {
		list[i] = fn(list[i])
	}

	return list
}

// MapTo is same as Map, but it can return another type of slice.
//
// Special case: when fn is nil, it returns the empty slice.
//
// PLay: https://go.dev/play/p/wClBNz0Fjxt
func MapTo[T any, R any](list []T, fn func(v T) R) []R {
	if len(list) == 0 {
		return []R{}
	}
	if fn == nil {
		return []R{}
	}

	var res = make([]R, len(list))
	for i := range list {
		res[i] = fn(list[i])
	}

	return res
}

// Shuffle shuffles a slice for random order.
// Implement based on rand.Shuffle
//
// Play: https://go.dev/play/p/A2yeiJDWIHp
func Shuffle[T any](list []T) {
	if len(list) == 0 {
		return
	}
	s := rand.NewSource(time.Now().UnixNano())
	rand.New(s).Shuffle(len(list), func(i, j int) { list[i], list[j] = list[j], list[i] })
	return
}

// Reduce accumulates and combines elements through a fn into a single value.
//
// Special case: when fn is nil, it returns the initial value
//
// Play: https://go.dev/play/p/gI8Mcvk4NGr
func Reduce[T any, R any](list []T, fn func(sum R, item T, index int) R, initial R) R {
	if fn == nil {
		return initial
	}
	for i, v := range list {
		initial = fn(initial, v, i)
	}

	return initial
}

// ReduceRight is like the Reduce, but the order is reserve.
//
// Special case: when fn is nil, it returns the initial value
//
// Play: https://go.dev/play/p/n1rGGeg1KFf
func ReduceRight[T any, R any](list []T, fn func(sum R, item T, index int) R, initial R) R {
	if fn == nil {
		return initial
	}
	for i := len(list) - 1; i >= 0; i-- {
		initial = fn(initial, list[i], i)
	}

	return initial
}

// Include returns true if the slice includes the element.
//
// Play: https://go.dev/play/p/6VW3_rG4AIX
func Include[T comparable](list []T, ele T) bool {
	for _, v := range list {
		if v == ele {
			return true
		}
	}
	return false
}

// Index returns the index of elements in the slice, or -1 if not found.
//
// Play: https://go.dev/play/p/4ZBiqNvs-Vc
func Index[T comparable](list []T, ele T) int {
	for i, v := range list {
		if v == ele {
			return i
		}
	}
	return -1
}

// LastIndex is same as Index, but it returns the last index.
//
// Play: https://go.dev/play/p/TL2YNWHvDqw
func LastIndex[T comparable](list []T, ele T) int {
	for i := len(list) - 1; i > 0; i-- {
		if list[i] == ele {
			return i
		}
	}
	return -1
}
