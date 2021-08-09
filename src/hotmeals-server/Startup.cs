using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.HttpsPolicy;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.OpenApi.Models;


namespace hotmeals_server
{
    public class Startup
    {
        public Startup(IConfiguration configuration)
        {
            Configuration = configuration;
        }

        public IConfiguration Configuration { get; }

        // This method gets called by the runtime. Use this method to add services to the container.
        public void ConfigureServices(IServiceCollection services)
        {
            // Log only to console and debug
            services.AddLogging(opt =>
            {
                opt.ClearProviders();
                opt.AddConsole();
                opt.AddDebug();
            });


            // Prevent access to the web server from anywhere else except our SPA application.
            services.AddCors(options =>
            {
                options.AddPolicy("DevPolicy",
                    builder => builder.WithOrigins("http://localhost:3000")
                        .AllowAnyMethod()
                        .AllowAnyHeader()
                        .AllowCredentials());
                options.AddPolicy("ProdPolicy", builder => { });
            });
            services.AddControllers();
            services.AddSwaggerGen(c =>
            {
                c.SwaggerDoc("v1", new OpenApiInfo { Title = "hotmeals_server", Version = "v1" });
            });

            services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme).AddCookie(opt =>
            {
                // As we are Web API there is no login page, just return 401 in case we are not authenticated
                opt.Events.OnRedirectToLogin = (ctx) =>
                {
                    ctx.Response.StatusCode = 401;
                    return Task.CompletedTask;
                };
            });
            // Add CSRF antiforgery token
            services.AddAntiforgery(options =>
            {
                // This should match the ServerAPI header key in the hotmeals-client application
                options.HeaderName = "RequestVerificationToken";
            });

            services.AddDbContext<Model.HMContext>(o=>o.UseSqlite(Configuration.GetConnectionString("DefaultConnection")));

        }

        // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
        public void Configure(IApplicationBuilder app, IWebHostEnvironment env, ILogger<Startup> log, Microsoft.AspNetCore.Mvc.Infrastructure.IActionDescriptorCollectionProvider actionProvider)
        {
            app.UseHttpsRedirection();
            if (env.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();
                app.UseSwagger();
                app.UseSwaggerUI(c =>
                {
                    c.SwaggerEndpoint("/swagger/v1/swagger.json", "hotmeals_server v1");
                    c.RoutePrefix = string.Empty;
                });
            }
            app.UseRouting();
            app.UseAntiforgery();

            if (env.IsDevelopment())
                app.UseCors("DevPolicy");
            else
                app.UseCors("ProdPolicy");

            app.UseAuthentication();
            app.UseAuthorization();
            app.UseEndpoints(endpoints =>
            {
                endpoints.MapControllers();
            });

            // List routes (for easier debugging)
            var features = app.ServerFeatures.Get<Microsoft.AspNetCore.Hosting.Server.Features.IServerAddressesFeature>();
            if (features != null)
            {
                foreach (var address in features.Addresses)
                {
                    log.Log(LogLevel.Information, "Listening on {url}", address);
                }
            }
            log.Log(LogLevel.Information, "Available routes:");
            var routes = actionProvider.ActionDescriptors.Items.Where(x => x.AttributeRouteInfo != null);
            foreach (var route in routes)
            {
                log.Log(LogLevel.Debug, $"{route.AttributeRouteInfo.Template}");
            }

        }
    }
}
