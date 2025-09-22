/**
 * Package lol
 * @Author iFurySt <ifuryst@gmail.com>
 * @Date 2023/7/20
 */

package lol

// Keys creates an array of the map keys.
//
// Play: https://go.dev/play/p/JlVhmI6ThnL
func Keys[K comparable, V any](mapping map[K]V) []K {
	res := make([]K, 0, len(mapping))

	for k := range mapping {
		res = append(res, k)
	}

	return res
}

// Values creates an array of the map values.
//
// Play: https://go.dev/play/p/YQrxuIzbimT
func Values[K comparable, V any](mapping map[K]V) []V {
	res := make([]V, 0, len(mapping))

	for _, v := range mapping {
		res = append(res, v)
	}

	return res
}
