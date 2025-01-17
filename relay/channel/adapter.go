package channel

import (
	"github.com/gin-gonic/gin"
	"io"
	"net/http"
	"one-api/dto"
	relaycommon "one-api/relay/common"
)

type Adaptor interface {
	// Init IsStream bool
	Init(info *relaycommon.RelayInfo, request dto.GeneralOpenAIRequest)
	InitRerank(info *relaycommon.RelayInfo, request dto.RerankRequest)
	GetRequestURL(info *relaycommon.RelayInfo) (string, error)
	SetupRequestHeader(c *gin.Context, req *http.Request, info *relaycommon.RelayInfo) error
	ConvertRequest(c *gin.Context, info *relaycommon.RelayInfo, request *dto.GeneralOpenAIRequest) (any, error)
	ConvertRerankRequest(c *gin.Context, relayMode int, request dto.RerankRequest) (any, error)
	DoRequest(c *gin.Context, info *relaycommon.RelayInfo, requestBody io.Reader) (*http.Response, error)
	DoResponse(c *gin.Context, resp *http.Response, info *relaycommon.RelayInfo) (usage *dto.Usage, err *dto.OpenAIErrorWithStatusCode)
	GetModelList() []string
	GetChannelName() string
}

type TaskAdaptor interface {
	Init(info *relaycommon.TaskRelayInfo)

	ValidateRequestAndSetAction(c *gin.Context, info *relaycommon.TaskRelayInfo) *dto.TaskError

	BuildRequestURL(info *relaycommon.TaskRelayInfo) (string, error)
	BuildRequestHeader(c *gin.Context, req *http.Request, info *relaycommon.TaskRelayInfo) error
	BuildRequestBody(c *gin.Context, info *relaycommon.TaskRelayInfo) (io.Reader, error)

	DoRequest(c *gin.Context, info *relaycommon.TaskRelayInfo, requestBody io.Reader) (*http.Response, error)
	DoResponse(c *gin.Context, resp *http.Response, info *relaycommon.TaskRelayInfo) (taskID string, taskData []byte, err *dto.TaskError)

	GetModelList() []string
	GetChannelName() string

	// FetchTask
	FetchTask(baseUrl, key string, body map[string]any) (*http.Response, error)
}
