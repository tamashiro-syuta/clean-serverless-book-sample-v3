// NOTE: UseCase では機能の実装はせずに、インターフェースのみを定義
package usecase

// CreateHelloMessage Helloメッセージ作成
type ICreateHelloMessage interface {
	Execute(req *CreateHelloMessageRequest) (*CreateHelloMessageResponse, error)
}

// CreateHelloMessageRequest Helloメッセージ作成リクエスト
type CreateHelloMessageRequest struct {
	Name string
}

// CreateHelloMessageResponse Helloメッセージ作成レスポンス
type CreateHelloMessageResponse struct {
	Message string
}
