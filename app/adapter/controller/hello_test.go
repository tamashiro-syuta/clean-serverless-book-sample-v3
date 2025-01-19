package controller

import (
	"bytes"
	"clean-serverless-book-sample/mocks"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/k0kubun/pp"
	"github.com/stretchr/testify/assert"
)

// TestPostHello_200 リクエストが成功する場合
func TestPostHello_200(t *testing.T) {
	// DynamoDB Local の設定
	tables := mocks.SetupDB(t)
	defer tables.Cleanup()
	router := setupRouter()
	// テスト⽤のリクエストBoyd
	body := map[string]interface{}{
		"name": "Taro",
	}
	bodyStr, err := json.Marshal(body)
	assert.NoError(t, err)
	// テスト⽤のリクエスト
	req, _ := http.NewRequest("POST", "/v1/hello", bytes.NewBuffer(bodyStr))
	req.Header.Set("Content-Type", "application/json")
	// 実⾏呼び出し
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)
	// レスポンスをmap形式に変換
	var resBody map[string]interface{}
	err = json.Unmarshal([]byte(w.Body.Bytes()), &resBody)
	assert.NoError(t, err)
	// ステータスコードを確認
	assert.Equal(t, 200, w.Code)
	// メッセージを確認
	assert.Equal(t, "Hello!Taro", resBody["message"])
}

// TestPostHello_400 バリデーションエラーが発⽣する場合
func TestPostHello_400(t *testing.T) {
	// DynamoDB Localの設定
	tables := mocks.SetupDB(t)
	defer tables.Cleanup()
	router := setupRouter()
	// テスト⽤のリクエストBody
	body := map[string]interface{}{
		"name": "",
	}
	bodyStr, err := json.Marshal(body)
	assert.NoError(t, err)
	// テスト⽤のリクエスト
	req, _ := http.NewRequest("POST", "/v1/hello", bytes.NewBuffer(bodyStr))
	req.Header.Set("Content-Type", "application/json")
	// 実⾏呼び出し
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)
	// レスポンスをmap形式に変換
	pp.Println(w.Body.String())
	var resBody map[string]interface{}
	err = json.Unmarshal(w.Body.Bytes(), &resBody)
	assert.NoError(t, err)
	// ステータスコードを確認
	assert.Equal(t, 400, w.Code)
	// エラーメッセージを確認
	errs := resBody["errors"].(map[string]interface{})
	assert.Equal(t, "名前を入力してください。", errs["name"])
}
