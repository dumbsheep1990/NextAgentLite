/**
 * Package lol
 * @Author iFurySt <ifuryst@gmail.com>
 * @Date 2023/7/20
 */

package lol

import "math"

type number interface {
	~int | ~int8 | ~int16 | ~int32 | ~int64 | ~float32 | ~float64
}

// Abs returns the absolute value of x.
//
// Special cases are:
//
//	Abs(±Inf) = +Inf
//	Abs(NaN) = NaN
//
// This implementation is from https://go-review.googlesource.com/c/go/+/436296
func Abs[T number](x T) T {
	//if x < 0 {
	//	return -x
	//}
	//return x
	return T(math.Float64frombits(math.Float64bits(float64(x)) &^ (1 << 63)))
}

// Max returns the largest of x and y.
func Max[T number](a, b T) T {
	if a > b {
		return a
	}
	return b
}

// Min returns the smallest of x and y.
func Min[T number](a, b T) T {
	if a < b {
		return a
	}
	return b
}
