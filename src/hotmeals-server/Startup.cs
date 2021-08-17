using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.OpenApi.Models;
using Microsoft.IdentityModel.Tokens;
using Microsoft.AspNetCore.Http;

namespace hotmeals_server
{
    public class Startup
    {
        private readonly IWebHostEnvironment env;
        public Startup(IConfiguration configuration, IWebHostEnvironment env)
        {
            this.env = env;
            Configuration = configuration;
        }

        public IConfiguration Configuration { get; }

        // This method gets called by the runtime. Use this method to add services to the container.
        public void ConfigureServices(IServiceCollection services)
        {
            var httpContextAccessor = new HttpContextAccessor();
            services.AddSingleton<IHttpContextAccessor>(httpContextAccessor);
            var logFolder = Configuration["LogFolder"] ?? "./logs";
            var loggerProvider = new Services.AsyncLoggerProvider(logFolder, "HotMeals_", true, httpContextAccessor: httpContextAccessor);
            loggerProvider.AutoArchiveLog = true;
            loggerProvider.NewLogFileCreated += LoggerProvider_NewLogFileCreated;
            var log = loggerProvider.CreateLogger("Startup");
            var assemblyName = this.GetType().Assembly.GetName();
            log.Log(LogLevel.Information, "{application} v{version}", assemblyName.Name, assemblyName.Version);
            log.Log(LogLevel.Information, "Configuring services ...");

            // Use this logger
            services.AddLogging(opt =>
            {
                opt.ClearProviders();
                opt.AddProvider(loggerProvider);
            });


            // Prevent access to the web server from anywhere else except our SPA application.
            services.AddCors(opt =>
            {
                // Dev policy for development
                opt.AddPolicy("DevPolicy",
                    builder => builder.WithOrigins("http://localhost:3000")
                        .AllowAnyMethod()
                        .AllowAnyHeader()
                        .AllowCredentials());

                // Production prohibits everything except the source                        
                opt.AddPolicy("ProdPolicy", builder => { });
            });

            services.AddControllers().AddJsonOptions(opt =>
            {
                var enumConverter = new System.Text.Json.Serialization.JsonStringEnumConverter();
                opt.JsonSerializerOptions.Converters.Add(enumConverter);
            });

            services.AddSwaggerGen(opt =>
            {
                opt.SwaggerDoc("v1", new OpenApiInfo { Title = "HotMeals", Version = "v1" });
            });

            var jwt = new Services.DefaultJwtService(
                jwtKey: Configuration["Jwt:Key"],
                jwtIssuer: Configuration["Jwt:Audience"],
                jwtAudience: Configuration["Jwt:Issuer"],
                tokenExpirationSeconds: Services.JwtServiceDefaults.JwtTokenExpirationSeconds,
                roleOwner: Services.JwtServiceDefaults.RoleOwner,
                roleCustomer: Services.JwtServiceDefaults.RoleCustomer);
            services.AddSingleton<Services.IJwtService>(jwt);


            services.AddAuthentication(opt =>
            {
                opt.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                opt.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
            }).AddJwtBearer(opt =>
            {
                opt.SaveToken = true;
                opt.TokenValidationParameters = jwt.GetTokenValidationParameters();
            });

            services.AddDbContext<Model.HMContext>(opt =>
            {
                opt.UseSqlite(Configuration.GetConnectionString("DefaultConnection"));
                //if (env.EnvironmentName == "Testing")
                //    opt.UseInMemoryDatabase("HotMeals");
            });
            // In production, the React files will be served from this directory
            services.AddSpaStaticFiles(configuration =>
            {
                configuration.RootPath = "client/build";
            });
            services.AddSignalR(opt =>
            {
                opt.KeepAliveInterval = TimeSpan.FromMinutes(5);
            }).AddJsonProtocol(opt =>
            {
                var enumConverter = new System.Text.Json.Serialization.JsonStringEnumConverter();
                opt.PayloadSerializerOptions.Converters.Add(enumConverter);
            });

            services.AddSingleton<Services.ICryptoService, Services.DefaultCryptoService>();
        }

        // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
        public void Configure(IApplicationBuilder app, IWebHostEnvironment env, ILogger<Startup> log)
        {

            log.Log(LogLevel.Information, "Configuring application ...");
            log.Log(LogLevel.Information, "Enabling HTTPS redirection");
            app.UseHttpsRedirection();
            if (env.IsDevelopment())
            {
                log.Log(LogLevel.Information, "Using developer exception page");
                app.UseDeveloperExceptionPage();
                log.Log(LogLevel.Information, "Using Swagger & Swagger UI");
                app.UseSwagger();
                app.UseSwaggerUI(c =>
                {
                    c.SwaggerEndpoint("/swagger/v1/swagger.json", "HotMeals API v1");
                    //c.RoutePrefix = "swagger";
                });
            }
            //app.UseStaticFiles();
            log.Log(LogLevel.Information, "Using SPA static files");
            app.UseSpaStaticFiles();

            app.UseRouting();

            if (env.IsDevelopment())
            {
                log.Log(LogLevel.Information, "Using Development CORS policy");
                app.UseCors("DevPolicy");
            }
            else
            {
                log.Log(LogLevel.Information, "Using Production CORS policy");
                app.UseCors("ProdPolicy");
            }

            log.Log(LogLevel.Information, "Enabling authentication and authorization");
            app.UseAuthentication();
            app.UseAuthorization();

            app.UseEndpoints(endpoints =>
            {
                log.Log(LogLevel.Information, "Using controllers");
                endpoints.MapControllers();
                log.Log(LogLevel.Information, "Using Signal-R hub at '/api/ws'");
                endpoints.MapHub<NotificationHub>("/api/ws");
            });
            app.UseSpa(spa =>
            {
            });

            using (var serviceScope = app.ApplicationServices.GetService<IServiceScopeFactory>().CreateScope())
            {
                var context = serviceScope.ServiceProvider.GetRequiredService<Model.HMContext>();
                if (context.Database.EnsureCreated())
                    log.LogWarning("There was no existing database, new database was created.");
                else
                    log.Log(LogLevel.Information, "Using existing database ... testing connection");
                // This will fail and cause an exception to be thrown 
                _ = context.Users.FirstOrDefault();

            }
        }

        private void LoggerProvider_NewLogFileCreated(object sender, EventArgs e)
        {
            var loggerProvider = (Services.AsyncLoggerProvider)sender;
            var log = loggerProvider.CreateLogger("Startup");
            var assemblyName = this.GetType().Assembly.GetName();
            log.Log(LogLevel.Information, "{application} v{version}", assemblyName.Name, assemblyName.Version);
        }

    }
}
