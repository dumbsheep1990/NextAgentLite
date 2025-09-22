/**
 * Package lol
 * @Author iFurySt <ifuryst@gmail.com>
 * @Date 2023/7/20
 */

package lol

import (
	"github.com/stretchr/testify/assert"
	"math"
	"testing"
)

func TestAbs(t *testing.T) {
	// int
	for _, c := range []struct {
		name   string
		number int64
		want   int64
	}{
		{"0", 0, 0},
		{"-0", -0, 0},
		{"3", 3, 3},
		{"-3", -3, 3},
		{"Inf-8", math.MinInt8, -math.MinInt8},
		{"Inf-32", math.MinInt32, -math.MinInt32},
	} {
		assert.Equalf(t, c.want, Abs(c.number), c.name)
	}

	// float64
	for _, c := range []struct {
		name   string
		number float64
		want   float64
	}{
		{"3", float64(3), float64(3)},
		{"-3", float64(-3), float64(3)},
		{"Inf", math.Inf(1), math.Inf(1)},
		{"-Inf", math.Inf(-1), math.Inf(1)},
	} {
		assert.Equalf(t, c.want, Abs(c.number), c.name)
	}
}

func TestMax(t *testing.T) {
	// int64
	for _, c := range []struct {
		name string
		a, b int64
		want int64
	}{
		{"0", 0, 0, 0},
		{"-0", -0, 0, 0},
		{"negative", -1, -3, -1},
		{"positive", 3, 1, 3},
		{"normal-case1", -10, 5, 5},
		{"normal-case2", 4, -4, 4},
	} {
		assert.Equalf(t, c.want, Max(c.a, c.b), c.name)
	}

	// float64
	for _, c := range []struct {
		name string
		a, b float64
		want float64
	}{
		{"0", 0.0, 0, 0},
		{"-0", -0, 0.0, 0},
		{"negative", -1.0, -3.0, -1},
		{"positive", 3.3, 1.1, 3.3},
		{"normal-case1", -10.1, 5.10, 5.10},
		{"normal-case2", 4, -4.5, 4},
	} {
		assert.Equalf(t, c.want, Max(c.a, c.b), c.name)
	}
}

func TestMin(t *testing.T) {
	// int64
	for _, c := range []struct {
		name string
		a, b int64
		want int64
	}{
		{"0", 0, 0, 0},
		{"-0", -0, 0, 0},
		{"negative", -1, -3, -3},
		{"positive", 3, 1, 1},
		{"normal-case1", -10, 5, -10},
		{"normal-case2", 4, -4, -4},
	} {
		assert.Equalf(t, c.want, Min(c.a, c.b), c.name)
	}

	// float64
	for _, c := range []struct {
		name string
		a, b float64
		want float64
	}{
		{"0", 0.0, 0, 0},
		{"-0", -0, 0.0, 0},
		{"negative", -1.0, -3.0, -3.0},
		{"positive", 3.3, 1.1, 1.1},
		{"normal-case1", -10.1, 5.10, -10.1},
		{"normal-case2", 4, -4.5, -4.5},
	} {
		assert.Equalf(t, c.want, Min(c.a, c.b), c.name)
	}
}
