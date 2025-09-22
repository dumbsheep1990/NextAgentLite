/**
 * Package lol
 * @Author iFurySt <ifuryst@gmail.com>
 * @Date 2024/6/18
 */

package lol

import "fmt"

func ExampleRandomString() {
	res1 := RandomString(8)
	res2 := RandomString(8, "8")
	fmt.Println(len(res1), len(res2))
	fmt.Println(res2)
	// Output:
	// 8 8
	// 88888888
}
