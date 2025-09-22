/**
 * Package lol
 * @Author iFurySt <ifuryst@gmail.com>
 * @Date 2023/7/19
 */

package lol

import (
	"fmt"
	"math"
	"sort"
)

func ExampleSortSlice() {
	s := []float64{3, 6, 1, math.NaN(), 9, math.NaN()}
	fmt.Println(s)
	SortSlice(s)
	fmt.Println(s)
	// Output:
	// [3 6 1 NaN 9 NaN]
	// [NaN NaN 1 3 6 9]
}

func ExampleMergeSlice() {
	res1 := MergeSlice([]int{1, 4, 7}, []int{2, 5, 8}, []int{3, 6, 9})
	res2 := MergeSlice([]int{1}, []int{2, 5, 8}, []int{3, 6}, []int{4, 7, 9, 10})
	fmt.Println(res1)
	fmt.Println(res2)
	// Output:
	// [1 4 7 2 5 8 3 6 9]
	// [1 2 5 8 3 6 4 7 9 10]
}

func ExampleUniqSlice() {
	res1 := UniqSlice([]int{1, 4, 7}, []int{4, 1, 2}, []int{7, 1, 3})
	res2 := UniqSlice([]int{4, 7, 9, 10})
	fmt.Println(res1)
	fmt.Println(res2)
	// Output:
	// [1 4 7 2 3]
	// [4 7 9 10]
}

func ExampleIntersection() {
	res1 := Intersection([]int{1, 4, 7}, []int{4, 1, 2}, []int{7, 1, 3})
	res2 := Intersection([]int{4, 7, 9, 10}, []int{4, 7, 9, 10})
	sort.Ints(res1)
	sort.Ints(res2)
	fmt.Println(res1)
	fmt.Println(res2)
	// Output:
	// [1]
	// [4 7 9 10]
}

func ExampleDifference() {
	res1 := Difference([]int{1, 4, 7, 11}, []int{4, 1, 2})
	res2 := Difference([]int{9, 10}, []int{4, 7, 9, 10})
	sort.Ints(res1)
	sort.Ints(res2)
	fmt.Println(res1)
	fmt.Println(res2)
	// Output:
	// [7 11]
	// []
}

func ExampleFindSliceDeltas() {
	added, removed, updated, unchanged := FindSliceDeltas([]int{1, 4, 7, 11}, []int{4, 1, 2}, func(t int) int {
		return t
	}, func(v1 int, v2 int) bool {
		return v1 == v2
	}, FindSliceDeltasOptions[int, int]{Compare: func(a, b int) int {
		return a - b
	}})
	fmt.Println(added)
	fmt.Println(removed)
	fmt.Println(updated)
	fmt.Println(unchanged)
	// Output:
	// [2]
	// [7 11]
	// []
	// [1 4]
}

func ExampleMap() {
	res := Map([]int{1, 3, 5}, func(i int) int { return i * 2 })
	fmt.Println(res)
	// Output:
	// [2 6 10]
}

func ExampleMapTo() {
	type user struct {
		name string
		age  uint8
	}
	res := MapTo([]user{
		{"Heisenberg", 35},
		{"Hank", 32},
		{"Saul", 33},
	}, func(u user) string { return u.name })
	fmt.Println(res)
	// Output:
	// [Heisenberg Hank Saul]
}

func ExampleShuffle() {
	s := []string{"a", "b", "c", "d"}
	Shuffle(s)
	fmt.Println(s)
}

func ExampleReduce() {
	res1 := Reduce([]int{1, 7, 3, 4}, func(s float64, v, i int) float64 {
		return s * float64(v)
	}, 2)
	res2 := Reduce([]string{"1", "7", "3", "4"}, func(s, v string, i int) string {
		return fmt.Sprintf("%s %d.%s", s, i, v)
	}, "start:")
	fmt.Println(res1)
	fmt.Println(res2)
	// Output:
	// 168
	// start: 0.1 1.7 2.3 3.4
}

func ExampleReduceRight() {
	res1 := ReduceRight([]int{1, 7, 3, 4}, func(s float64, v, i int) float64 {
		return s * float64(v)
	}, 2)
	res2 := ReduceRight([]string{"1", "7", "3", "4"}, func(s, v string, i int) string {
		return fmt.Sprintf("%s %d.%s", s, i, v)
	}, "reverse:")
	fmt.Println(res1)
	fmt.Println(res2)
	// Output:
	// 168
	// reverse: 3.4 2.3 1.7 0.1
}

func ExampleInclude() {
	res1 := Include([]int{1, 7, 3, 4}, 3)
	res2 := Include([]string{"1", "7", "3", "4"}, "x")
	fmt.Println(res1)
	fmt.Println(res2)
	// Output:
	// true
	// false
}

func ExampleIndex() {
	res1 := Index([]int{1, 7, 3, 4, 3}, 3)
	res2 := Index([]string{"1", "7", "3", "4"}, "x")
	fmt.Println(res1)
	fmt.Println(res2)
	// Output:
	// 2
	// -1
}

func ExampleLastIndex() {
	res1 := LastIndex([]int{1, 7, 3, 4, 3}, 3)
	res2 := LastIndex([]string{"1", "7", "3", "4"}, "x")
	fmt.Println(res1)
	fmt.Println(res2)
	// Output:
	// 4
	// -1
}
