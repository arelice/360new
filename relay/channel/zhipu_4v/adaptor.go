package zhipu_4v

import (
	"errors"
	"fmt"
	"github.com/gin-gonic/gin"
	"io"
	"net/http"
	"one-api/dto"
	"one-api/relay/channel"
	"one-api/relay/channel/openai"
	relaycommon "one-api/relay/common"
	"one-api/service"
)

type Adaptor struct {
}

func (a *Adaptor) InitRerank(info *relaycommon.RelayInfo, request dto.RerankRequest) {
	//TODO implement me

}

func (a *Adaptor) Init(info *relaycommon.RelayInfo, request dto.GeneralOpenAIRequest) {
}

func (a *Adaptor) GetRequestURL(info *relaycommon.RelayInfo) (string, error) {
	return fmt.Sprintf("%s/api/paas/v4/chat/completions", info.BaseUrl), nil
}

func (a *Adaptor) SetupRequestHeader(c *gin.Context, req *http.Request, info *relaycommon.RelayInfo) error {
	channel.SetupApiRequestHeader(info, c, req)
	token := getZhipuToken(info.ApiKey)
	req.Header.Set("Authorization", token)
	return nil
}

func (a *Adaptor) ConvertRequest(c *gin.Context, info *relaycommon.RelayInfo, request *dto.GeneralOpenAIRequest) (any, error) {
	if request == nil {
		return nil, errors.New("request is nil")
	}
	if request.TopP >= 1 {
		request.TopP = 0.99
	}
	return requestOpenAI2Zhipu(*request), nil
}

func (a *Adaptor) ConvertRerankRequest(c *gin.Context, relayMode int, request dto.RerankRequest) (any, error) {
	return nil, nil
}

func (a *Adaptor) DoRequest(c *gin.Context, info *relaycommon.RelayInfo, requestBody io.Reader) (*http.Response, error) {
	return channel.DoApiRequest(a, c, info, requestBody)
}

func (a *Adaptor) DoResponse(c *gin.Context, resp *http.Response, info *relaycommon.RelayInfo) (usage *dto.Usage, err *dto.OpenAIErrorWithStatusCode) {
	if info.IsStream {
		var responseText string
		var toolCount int
		err, usage, responseText, toolCount = openai.OpenaiStreamHandler(c, resp, info)
		if usage == nil || usage.TotalTokens == 0 || (usage.PromptTokens+usage.CompletionTokens) == 0 {
			usage, _ = service.ResponseText2Usage(responseText, info.UpstreamModelName, info.PromptTokens)
			usage.CompletionTokens += toolCount * 7
		}
	} else {
		err, usage = openai.OpenaiHandler(c, resp, info.PromptTokens, info.UpstreamModelName)
	}
	return
}

func (a *Adaptor) GetModelList() []string {
	return ModelList
}

func (a *Adaptor) GetChannelName() string {
	return ChannelName
}
