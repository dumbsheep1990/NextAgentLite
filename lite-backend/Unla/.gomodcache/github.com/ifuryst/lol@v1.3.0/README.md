# lol

[![Go Reference][doc-img]][doc] [![Build Status][ci-img]][ci] [![Coverage Status][cov-img]][cov]

👾 Devoted to creating a simple and efficient Go toolbox, and maintaining it continuously.

## Installation
`go get -u github.com/ifuryst/lol`

## Quick Start
```go
package main

import (
	"fmt"
	"github.com/ifuryst/lol"
)

func main() {
	res1 := lol.MergeSlice([]int{1, 4, 7}, []int{2, 5, 8}, []int{3, 6, 9})
	res2 := lol.MergeSlice([]int{1}, []int{2, 5, 8}, []int{3, 6}, []int{4, 7, 9, 10})
	fmt.Println(res1)
	fmt.Println(res2)
	// Output:
	// [1 4 7 2 5 8 3 6 9]
	// [1 2 5 8 3 6 4 7 9 10]
}
```

## Usage
For more detailed usage, you can visit the [wiki page](https://github.com/iFurySt/lol/wiki).

## Contributing
Contributions Welcome!
1. Fork it!
2. Create your feature branch: `git checkout -b my-new-feature`
3. Commit your changes: `git commit -am 'feat: add some feature'`
4. Push to the branch: `git push origin my-new-feature`
5. Submit a pull request :D

## License
Released under the [MIT License](LICENSE).

[doc-img]: https://pkg.go.dev/badge/github.com/ifuryst/lol.svg
[doc]: https://pkg.go.dev/github.com/ifuryst/lol
[ci-img]: https://github.com/iFurySt/lol/actions/workflows/test.yml/badge.svg
[ci]: https://github.com/iFurySt/lol/actions/workflows/test.yml
[cov-img]: https://codecov.io/gh/iFurySt/lol/branch/main/graph/badge.svg
[cov]: https://codecov.io/gh/iFurySt/lol