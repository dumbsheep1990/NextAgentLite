/**
 * Package lol
 * @Author iFurySt <ifuryst@gmail.com>
 * @Date 2024/5/20
 */

package lol

import (
	"context"
	"sync"
	"time"
)

// DoThenRepeat executes a given function periodically at a specified interval until the context is done.
// Parameters:
//   - ctx: A context to control the lifetime of the function's execution. When the context is canceled, the function stops executing.
//   - interval: The duration between consecutive function executions.
//   - fn: The function to be executed periodically.
//   - waitForPrevious: A boolean flag indicating whether to wait for the previous execution to complete before starting a new one.
//     If true, the function executes sequentially. If false, the function starts a new execution even if the previous one is still running.
//
// Returns a function that blocks until all the function executions are completed.
//
// The function runs asynchronously in a goroutine, and the first execution occurs immediately upon calling DoThenRepeat.
//
// Play: https://go.dev/play/p/aF2fcqmJKAZ
func DoThenRepeat(ctx context.Context, interval time.Duration, fn func(), waitForPrevious bool) func() {
	if fn == nil {
		return func() {}
	}
	var wg sync.WaitGroup
	done := make(chan struct{})
	go func() {
		wg.Add(1)
		fn()
		wg.Done()
		ticker := time.NewTicker(interval)
		defer ticker.Stop()

		for {
			select {
			case <-ctx.Done():
				close(done)
				return
			case <-ticker.C:
				wg.Add(1)
				if waitForPrevious {
					fn()
					wg.Done()
				} else {
					go func() {
						fn()
						wg.Done()
					}()
				}
			}
		}
	}()
	return func() {
		<-done
		wg.Wait()
	}
}

// RepeatTask executes a given function periodically at a specified interval until the context is done.
// Parameters:
//   - ctx: A context to control the lifetime of the function's execution. When the context is canceled, the function stops executing.
//   - interval: The duration between consecutive function executions.
//   - fn: The function to be executed periodically.
//   - waitForPrevious: A boolean flag indicating whether to wait for the previous execution to complete before starting a new one.
//     If true, the function executes sequentially. If false, the function starts a new execution even if the previous one is still running.
//
// Returns a function that blocks until all the function executions are completed.
//
// The function runs asynchronously in a goroutine, and the first execution occurs after the first interval has elapsed.
//
// Play: https://go.dev/play/p/ldnDL__QNlh
func RepeatTask(ctx context.Context, interval time.Duration, fn func(), waitForPrevious bool) func() {
	if fn == nil {
		return func() {}
	}
	var wg sync.WaitGroup
	done := make(chan struct{})
	go func() {
		ticker := time.NewTicker(interval)
		defer ticker.Stop()

		for {
			select {
			case <-ctx.Done():
				close(done)
				return
			case <-ticker.C:
				wg.Add(1)
				if waitForPrevious {
					fn()
					wg.Done()
				} else {
					go func() {
						fn()
						wg.Done()
					}()
				}
			}
		}
	}()
	return func() {
		<-done
		wg.Wait()
	}
}
