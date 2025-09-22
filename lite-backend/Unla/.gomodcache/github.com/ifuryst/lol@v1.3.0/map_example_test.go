/**
 * Package lol
 * @Author iFurySt <ifuryst@gmail.com>
 * @Date 2023/7/20
 */

package lol

import (
	"fmt"
	"sort"
)

func ExampleKeys() {
	res1 := Keys(map[int]struct{}{
		1: {},
		7: {},
		3: {},
		4: {},
	})
	sort.Ints(res1)
	res2 := Keys(map[string]struct{}{
		"a": {},
		"b": {},
		"1": {},
		"2": {},
	})
	sort.Strings(res2)
	fmt.Println(res1)
	fmt.Println(res2)
	// Output:
	// [1 3 4 7]
	// [1 2 a b]
}

func ExampleValues() {
	res1 := Values(map[int]int{
		1: 3,
		7: 5,
		3: 9,
		4: 7,
	})
	sort.Ints(res1)
	res2 := Values(map[int]string{
		1: "3",
		7: "5",
		3: "9",
		4: "7",
	})
	sort.Strings(res2)
	fmt.Println(res1)
	fmt.Println(res2)
	// Output:
	// [3 5 7 9]
	// [3 5 7 9]
}
