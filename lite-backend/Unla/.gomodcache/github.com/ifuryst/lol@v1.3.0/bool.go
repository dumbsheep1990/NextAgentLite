/**
 * Package lol
 * @Author iFurySt <ifuryst@gmail.com>
 * @Date 2023/7/19
 */

package lol

// NewTrue returns a pointer to a new bool with true.
func NewTrue() *bool {
	v := true
	return &v
}

// NewFalse returns a pointer to a new bool with false.
func NewFalse() *bool {
	v := false
	return &v
}
