package main

import (
	"fmt"

	"github.com/aws/aws-lambda-go/lambda"
)

type EventRequest struct {
	Action string `json:"action"`
}

// NOTE: Lambda ハンドラー handler 関数で、EventBridge から渡されたイベントデータをログ出力
func handler(event EventRequest) error {
	fmt.Printf("%+v", event)
	return nil
}

func main() {
	lambda.Start(handler)
}
