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
            // Log only to console and debug
            services.AddLogging(opt =>
            {
                opt.ClearProviders();
                opt.AddConsole();
                opt.AddDebug();
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
        public void Configure(IApplicationBuilder app, IWebHostEnvironment env, ILogger<Startup> log, Microsoft.AspNetCore.Mvc.Infrastructure.IActionDescriptorCollectionProvider actionProvider)
        {
            app.UseHttpsRedirection();
            if (env.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();
                app.UseSwagger();
                app.UseSwaggerUI(c =>
                {
                    c.SwaggerEndpoint("/swagger/v1/swagger.json", "HotMeals API v1");
                    //c.RoutePrefix = "swagger";
                });
            }
            //app.UseStaticFiles();
            app.UseSpaStaticFiles();

            app.UseRouting();

            if (env.IsDevelopment())
                app.UseCors("DevPolicy");
            else
                app.UseCors("ProdPolicy");

            app.UseAuthentication();
            app.UseAuthorization();

            //app.UseDelay(1); // TODO: Remove later
            app.UseEndpoints(endpoints =>
            {
                endpoints.MapControllers();
                endpoints.MapHub<NotificationHub>("/api/ws");
            });
            app.UseSpa(spa =>
            {
            });

            using (var serviceScope = app.ApplicationServices.GetService<IServiceScopeFactory>().CreateScope())
            {
                var context = serviceScope.ServiceProvider.GetRequiredService<Model.HMContext>();
                if(context.Database.EnsureCreated()) 
                {
                    log.LogWarning("New database generated!");
                }
            }
        }
    }
}
