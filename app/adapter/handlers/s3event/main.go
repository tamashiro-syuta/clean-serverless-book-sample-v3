package main

import (
	"fmt"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
)

// NOTE: S3イベントを受け取って処理するLambda関数を作成
// NOTE: この関数が S3 イベントのトリガーを受けて実⾏され、引数 eventは events.S3Event 型で、S3 イベントの詳細情報を含んでいる
func handler(event events.S3Event) error {
	fmt.Printf("%+v", event)
	return nil
}

func main() {
	lambda.Start(handler)
}
