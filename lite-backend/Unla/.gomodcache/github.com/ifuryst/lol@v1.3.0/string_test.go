/**
 * Package lol
 * @Author iFurySt <ifuryst@gmail.com>
 * @Date 2024/6/18
 */

package lol

import (
	"github.com/stretchr/testify/assert"
	"testing"
)

func TestRandomStringWithDefaultCharset(t *testing.T) {
	// Arrange
	length := 8

	// Act
	result1 := RandomString(length)
	result2 := RandomString(length)

	// Assert
	assert.NotEqual(t, result1, result2)
	assert.Equal(t, length, len(result1))
	for _, char := range result1 {
		assert.Contains(t, defCharset, string(char))
	}
}

func TestRandomStringEqual(t *testing.T) {
	// Arrange
	length := 8

	// Act
	result1 := RandomString(length, "1")
	result2 := RandomString(length, "1")

	// Assert
	assert.Equal(t, result1, result2)
	assert.Equal(t, result1, "11111111")
}

func TestRandomStringEmptyCharset(t *testing.T) {
	// Arrange
	length := 8

	// Act
	result1 := RandomString(length, "")
	result2 := RandomString(length, "")

	// Assert
	assert.NotEqual(t, result1, result2)
	assert.Equal(t, len(result1), len(result2))
	assert.Equal(t, len(result1), 8)
}

func TestRandomStringWithZeroLength(t *testing.T) {
	// Arrange
	length := 0

	// Act
	result := RandomString(length)

	// Assert
	assert.Equal(t, length, len(result))
}
