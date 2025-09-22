/**
 * Package lol
 * @Author iFurySt <ifuryst@gmail.com>
 * @Date 2023/7/19
 */

package lol

import "fmt"

func ExampleNewTrue() {
	fmt.Println(*NewTrue())
	fmt.Println(*NewFalse())
	// Output:
	// true
	// false
}
