using hotmeals_server.Model;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace hotmeals_server.tests
{

    public class TestWebApplicationFactory<T> : WebApplicationFactory<T> where T : class
    {
        private readonly string dbName;

        public TestWebApplicationFactory(string dbName)
        {
            this.dbName = dbName;
        }

        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            base.ConfigureWebHost(builder);
            builder.ConfigureServices(services =>
            {
                var descriptor = services.Single(x => x.ServiceType == typeof(DbContextOptions<HMContext>));
                services.Remove(descriptor);
                services.AddDbContext<HMContext>(opt =>
                {
                    opt.UseInMemoryDatabase(dbName);
                });

                using (var sp = services.BuildServiceProvider())
                using (var scope = sp.CreateScope())
                {
                    var db = scope.ServiceProvider.GetRequiredService<HMContext>();
                    db.Database.EnsureDeleted();
                    db.Database.EnsureCreated();
                }

            });
        }


    }

}
