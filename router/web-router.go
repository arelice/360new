package router

import (
	"embed"
	"github.com/gin-contrib/gzip"
	"github.com/gin-contrib/static"
	"github.com/gin-gonic/gin"
	"io/fs"
	"net/http"
	"one-api/controller"
	"one-api/middleware"
	"strings"
)

//go:embed web web-admin
var buildFS embed.FS

// FileSystem 自定义文件系统
type FileSystem struct {
	http.FileSystem
}

// Exists 检查文件是否存在
func (fs FileSystem) Exists(prefix string, path string) bool {
	_, err := fs.Open(strings.TrimPrefix(path, prefix))
	return err == nil
}

func SetWebRouter(router *gin.Engine, indexPageUser []byte, indexPageAdmin []byte) {
	router.Use(gzip.Gzip(gzip.DefaultCompression))
	router.Use(middleware.GlobalWebRateLimit())
	router.Use(middleware.Cache())

	// Serve the default (user) frontend
	fsysUser, _ := fs.Sub(buildFS, "web")
	router.Use(static.Serve("/", FileSystem{http.FS(fsysUser)}))

	// Serve the admin frontend
	fsysAdmin, _ := fs.Sub(buildFS, "web-admin")
	router.Use(static.Serve("/admin", FileSystem{http.FS(fsysAdmin)}))

	router.NoRoute(func(c *gin.Context) {
		if strings.HasPrefix(c.Request.RequestURI, "/v1") || strings.HasPrefix(c.Request.RequestURI, "/api") || strings.HasPrefix(c.Request.RequestURI, "/assets") {
			controller.RelayNotFound(c)
			return
		}

		if strings.HasPrefix(c.Request.RequestURI, "/admin") {
			c.Header("Cache-Control", "no-cache")
			c.Data(http.StatusOK, "text/html; charset=utf-8", indexPageAdmin)
		} else {
			c.Header("Cache-Control", "no-cache")
			c.Data(http.StatusOK, "text/html; charset=utf-8", indexPageUser)
		}
	})
}
