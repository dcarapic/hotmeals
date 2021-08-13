using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace hotmeals_server
{

    public static class Extensions
    {
        /// <summary>
        /// Adds an antiforgery token to every GET request. 
        /// Validate every mutating request (POST, PUT, DELETE, PATCH) for antiforgery token.
        /// </summary>
        public static IApplicationBuilder UseAntiforgery(this IApplicationBuilder app, string tokenName)
        {
            var antiforgery = (IAntiforgery)app.ApplicationServices.GetService(typeof(IAntiforgery));
            return app.Use(next => async context =>
                {
                    string path = context.Request.Path.Value;
                    if (context.Request.Method == HttpMethods.Get)
                    {
                        // Add CSRF coopkie for antiforgery
                        var tokens = antiforgery.GetAndStoreTokens(context);
                        // Add CSRF cookie which is to be read by API and returned via 'X-XSRF-TOKEN' header field
                        // Note: This must match the 
                        context.Response.Cookies.Append(tokenName, tokens.RequestToken, new CookieOptions() { HttpOnly = false });
                    }
                    else if (context.Request.Method == HttpMethods.Patch || context.Request.Method == HttpMethods.Post || context.Request.Method == HttpMethods.Put || context.Request.Method == HttpMethods.Delete)
                    {
                        // Validate the token.
                        if(!await antiforgery.IsRequestValidAsync(context)) {
                            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                            await context.Response.Body.WriteAsync(System.Text.Encoding.UTF8.GetBytes("Please provide 'X-XSRF-TOKEN' header with a valid XSRF-TOKEN value!"));
                            return;
                        }

                    }
                    await next(context);
                });
        }

        /// <summary>
        /// Adds a delay when executing a request
        /// </summary>
        /// <param name="app"></param>
        /// <param name="seconds"></param>
        /// <returns></returns>
        public static IApplicationBuilder UseDelay(this IApplicationBuilder app, int seconds)
        {
            return app.Use(next => async context =>
                {
                    await Task.Delay(seconds * 1000, context.RequestAborted);
                    await next(context);
                });
        }

    }
}