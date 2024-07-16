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

func SetWebRouter(router *gin.Engine, indexPageUser []byte, indexPageAdmin []byte) {
	router.Use(gzip.Gzip(gzip.DefaultCompression))
	router.Use(middleware.GlobalWebRateLimit())
	router.Use(middleware.Cache())

	// Serve the default (user) frontend
	fsysUser, _ := fs.Sub(buildFS, "web")
	router.Use(static.Serve("/", http.FS(fsysUser)))

	// Serve the admin frontend
	fsysAdmin, _ := fs.Sub(buildFS, "web-admin")
	router.Use(static.Serve("/admin", http.FS(fsysAdmin)))

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
