/**
 * Package lol
 * @Author iFurySt <ifuryst@gmail.com>
 * @Date 2024/6/18
 */

package lol

import (
	"math/rand"
	"time"
)

const defCharset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"

// RandomString generates a random string with a given length.
// If a charset is provided, it will be used to generate the random string.
// Otherwise, the default charset will be used.
//
// Play: https://go.dev/play/p/jpdJyEVdLcq
func RandomString(length int, charset ...string) string {
	if len(charset) > 0 && len(charset[0]) > 0 {
		return randomString(length, charset[0])
	}
	return randomString(length, defCharset)
}

// randomString generates a random string with a given length and charset.
func randomString(length int, charset string) string {
	r := rand.New(rand.NewSource(time.Now().UnixNano()))
	b := make([]byte, length)
	for i := range b {
		b[i] = charset[r.Intn(len(charset))]
	}
	return string(b)
}
