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
        public static IApplicationBuilder UseAntiforgery(this IApplicationBuilder app)
        {
            var antiforgery = (IAntiforgery)app.ApplicationServices.GetService(typeof(IAntiforgery));
            return app.Use(next => context =>
                {
                    string path = context.Request.Path.Value;
                    if (
                        string.Equals(path, "/", StringComparison.OrdinalIgnoreCase) ||
                        string.Equals(path, "/index.html", StringComparison.OrdinalIgnoreCase))
                    {
                        // The request token can be sent as a JavaScript-readable cookie, 
                        // and Angular uses it by default.
                        var tokens = antiforgery.GetAndStoreTokens(context);
                        context.Response.Cookies.Append("XSRF-TOKEN", tokens.RequestToken,
                            new CookieOptions() { HttpOnly = false });
                    }

                    return next(context);
                });
        }
    }
}