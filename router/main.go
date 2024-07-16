package router

import (
	"embed"
	"fmt"
	"github.com/gin-gonic/gin"
	"net/http"
	"one-api/common"
	"os"
	"strings"
)

//go:embed web web-admin
var BuildFS embed.FS

func SetRouter(router *gin.Engine) {
	SetApiRouter(router)
	SetDashboardRouter(router)
	SetRelayRouter(router)

	frontendBaseUrl := os.Getenv("FRONTEND_BASE_URL")
	if common.IsMasterNode && frontendBaseUrl != "" {
		frontendBaseUrl = ""
		common.SysLog("FRONTEND_BASE_URL is ignored on master node")
	}

	if frontendBaseUrl == "" {
		// 读取嵌入的index.html文件
		indexPageUser, err := BuildFS.ReadFile("web/index.html")
		if err != nil {
			common.SysError("Failed to read user index.html: " + err.Error())
		}
		indexPageAdmin, err := BuildFS.ReadFile("web-admin/index.html")
		if err != nil {
			common.SysError("Failed to read admin index.html: " + err.Error())
		}

		SetWebRouter(router, indexPageUser, indexPageAdmin)
	} else {
		frontendBaseUrl = strings.TrimSuffix(frontendBaseUrl, "/")
		router.NoRoute(func(c *gin.Context) {
			c.Redirect(http.StatusMovedPermanently, fmt.Sprintf("%s%s", frontendBaseUrl, c.Request.RequestURI))
		})
	}
}
