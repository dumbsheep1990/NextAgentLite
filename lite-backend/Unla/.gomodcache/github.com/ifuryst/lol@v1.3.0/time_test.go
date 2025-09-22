/**
 * Package lol
 * @Author iFurySt <ifuryst@gmail.com>
 * @Date 2024/5/20
 */

package lol

import (
	"context"
	"github.com/stretchr/testify/assert"
	"os"
	"os/signal"
	"sync/atomic"
	"testing"
	"time"
)

func TestDoThenRepeatParallel(t *testing.T) {
	ctx, cancel := signal.NotifyContext(context.Background(), os.Interrupt)

	i := atomic.Int32{}
	wait := DoThenRepeat(ctx, time.Millisecond*400, func() {
		i.Add(1)
		time.Sleep(300 * time.Millisecond)
	}, false)

	time.Sleep(1 * time.Second)
	cancel()
	wait()

	assert.GreaterOrEqual(t, i.Load(), int32(2))
}

func TestDoThenRepeatSequential(t *testing.T) {
	ctx, cancel := signal.NotifyContext(context.Background(), os.Interrupt)

	i := atomic.Int32{}
	wait := DoThenRepeat(ctx, time.Millisecond*100, func() {
		i.Add(1)
		time.Sleep(300 * time.Millisecond)
	}, true)

	time.Sleep(1 * time.Second)
	cancel()
	wait()

	assert.GreaterOrEqual(t, i.Load(), int32(3))
}

func TestRepeatTaskParallel(t *testing.T) {
	ctx, cancel := signal.NotifyContext(context.Background(), os.Interrupt)

	i := atomic.Int32{}
	wait := RepeatTask(ctx, time.Millisecond*400, func() {
		i.Add(1)
		time.Sleep(300 * time.Millisecond)
	}, false)

	time.Sleep(1 * time.Second)
	cancel()
	wait()

	assert.GreaterOrEqual(t, i.Load(), int32(2))
}

func TestRepeatTaskSequential(t *testing.T) {
	ctx, cancel := signal.NotifyContext(context.Background(), os.Interrupt)

	i := atomic.Int32{}
	wait := RepeatTask(ctx, time.Millisecond*100, func() {
		i.Add(1)
		time.Sleep(300 * time.Millisecond)
	}, true)

	time.Sleep(1 * time.Second)
	cancel()
	wait()

	assert.GreaterOrEqual(t, i.Load(), int32(3))
}
