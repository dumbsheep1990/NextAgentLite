/**
 * Package lol
 * @Author iFurySt <ifuryst@gmail.com>
 * @Date 2023/7/20
 */

package lol

import (
	"fmt"
)

func ExampleAbs() {
	xFloat64 := Abs(float64(-2))
	fmt.Printf("%.1f, %T\n", xFloat64, xFloat64)

	yFloat64 := Abs(float64(2))
	fmt.Printf("%.1f, %T\n", yFloat64, yFloat64)

	xInt := Abs(int(-2))
	fmt.Printf("%d, %T\n", xInt, xInt)

	yInt := Abs(int(2))
	fmt.Printf("%d, %T\n", yInt, yInt)

	type int64Type int64
	xTypeInt64 := Abs(int64Type(-2))
	fmt.Printf("%d, %T\n", xTypeInt64, xTypeInt64)

	yTypeInt64 := Abs(int64Type(2))
	fmt.Printf("%d, %T\n", yTypeInt64, yTypeInt64)

	// Output:
	// 2.0, float64
	// 2.0, float64
	// 2, int
	// 2, int
	// 2, lol.int64Type
	// 2, lol.int64Type
}

func ExampleMax() {
	fmt.Println(Max(3, 1))
	fmt.Println(Max(3.3, -1.0))
	// Output:
	// 3
	// 3.3
}

func ExampleMin() {
	fmt.Println(Min(3, 1))
	fmt.Println(Min(3.3, -1.0))
	// Output:
	// 1
	// -1
}
