/**
 * Package lol
 * @Author iFurySt <ifuryst@gmail.com>
 * @Date 2024/5/20
 */

package lol

import (
	"context"
	"fmt"
	"os"
	"os/signal"
	"sync/atomic"
	"time"
)

func ExampleDoThenRepeat() {
	ctx, cancel := signal.NotifyContext(context.Background(), os.Interrupt)

	i := atomic.Int32{}
	wait := DoThenRepeat(ctx, time.Millisecond*400, func() {
		i.Add(1)
		time.Sleep(300 * time.Millisecond)
	}, false)

	time.Sleep(1 * time.Second)
	cancel()
	wait()

	fmt.Println(i.Load() >= 2)
	// Output:
	// true
}

func ExampleRepeatTask() {
	ctx, cancel := signal.NotifyContext(context.Background(), os.Interrupt)

	i := atomic.Int32{}
	wait := RepeatTask(ctx, time.Millisecond*400, func() {
		i.Add(1)
		time.Sleep(300 * time.Millisecond)
	}, false)

	time.Sleep(1 * time.Second)
	cancel()
	wait()

	fmt.Println(i.Load() >= 2)
	// Output:
	// true
}
