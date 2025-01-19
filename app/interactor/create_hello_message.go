package interactor

import (
	"clean-serverless-book-sample/usecase"
	"fmt"
)

// CreateHelloMessage Helloメッセージ作成
type CreateHelloMessage struct{}

// NewCreateHelloMessage CreateHelloMessageインスタンスを⽣成
func NewCreateHelloMessage() *CreateHelloMessage {
	return &CreateHelloMessage{}
}

// Execute 実⾏
// NOTE: リクエストで受け取った名前を含むメッセージを⽣成
// NOTE: usecase層で定義したinterfaceをCreateHelloMessageが暗に実装している
func (c *CreateHelloMessage) Execute(req *usecase.CreateHelloMessageRequest) (*usecase.CreateHelloMessageResponse, error) {
	msg := fmt.Sprintf("Hello!%s", req.Name)
	return &usecase.CreateHelloMessageResponse{Message: msg}, nil
}
