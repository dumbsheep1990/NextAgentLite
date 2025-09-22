/**
 * Package lol
 * @Author iFurySt <ifuryst@gmail.com>
 * @Date 2023/7/19
 */

package lol

import (
	"github.com/stretchr/testify/assert"
	"testing"
)

func TestNewTrue(t *testing.T) {
	assert.NotNil(t, NewTrue())
	assert.Equal(t, true, *NewTrue())
}

func TestNewFalse(t *testing.T) {
	assert.NotNil(t, NewFalse())
	assert.Equal(t, false, *NewFalse())
}
