/**
 * Package lol
 * @Author iFurySt <ifuryst@gmail.com>
 * @Date 2023/7/20
 */

package lol

import (
	"github.com/stretchr/testify/assert"
	"sort"
	"testing"
)

func TestKeys(t *testing.T) {
	for _, c := range []struct {
		name   string
		inputs map[string]int
		want   []string
	}{
		{
			"nil",
			nil,
			[]string{},
		},
		{
			"empty",
			map[string]int{},
			[]string{},
		},
		{
			"string",
			map[string]int{
				"one":   1,
				"two":   2,
				"three": 3,
			},
			[]string{"one", "three", "two"},
		},
	} {
		res := Keys(c.inputs)
		sort.Strings(res)
		assert.Equalf(t, c.want, res, c.name)
	}
}

func TestValues(t *testing.T) {
	for _, c := range []struct {
		name   string
		inputs map[string]int
		want   []int
	}{
		{
			"nil",
			nil,
			[]int{},
		},
		{
			"empty",
			map[string]int{},
			[]int{},
		},
		{
			"string",
			map[string]int{
				"one":   1,
				"two":   2,
				"three": 3,
			},
			[]int{1, 2, 3},
		},
	} {
		res := Values(c.inputs)
		sort.Ints(res)
		assert.Equalf(t, c.want, res, c.name)
	}
}
