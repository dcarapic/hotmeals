using System;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata;

#nullable disable

namespace hotmeals_server.Model
{
    public partial class HMContext : DbContext
    {
        public HMContext()
        {
        }

        public HMContext(DbContextOptions<HMContext> options)
            : base(options)
        {
        }

        public virtual DbSet<BlockedUser> BlockedUsers { get; set; }
        public virtual DbSet<MenuItem> MenuItems { get; set; }
        public virtual DbSet<Order> Orders { get; set; }
        public virtual DbSet<OrderItem> OrderItems { get; set; }
        public virtual DbSet<Restaurant> Restaurants { get; set; }
        public virtual DbSet<User> Users { get; set; }

        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<BlockedUser>(entity =>
            {
                entity.HasKey(e => new { e.UserId, e.RestaurantId });

                entity.ToTable("BlockedUser");

                entity.Property(e => e.UserId).HasColumnType("guid");

                entity.Property(e => e.RestaurantId).HasColumnType("guid");

                entity.HasOne(d => d.Restaurant)
                    .WithMany(p => p.BlockedUsers)
                    .HasForeignKey(d => d.RestaurantId);

                entity.HasOne(d => d.User)
                    .WithMany(p => p.BlockedUsers)
                    .HasForeignKey(d => d.UserId);
            });

            modelBuilder.Entity<MenuItem>(entity =>
            {
                entity.ToTable("MenuItem");

                entity.Property(e => e.Id).HasColumnType("guid");

                entity.Property(e => e.Description)
                    .IsRequired()
                    .HasColumnType("nvarchar(1000)");

                entity.Property(e => e.Name)
                    .IsRequired()
                    .HasColumnType("nvarchar(100)");

                entity.Property(e => e.Price)
                    .IsRequired()
                    .HasColumnType("decimal(9, 2)");

                entity.Property(e => e.RestaurantId)
                    .IsRequired()
                    .HasColumnType("guid");

                entity.HasOne(d => d.Restaurant)
                    .WithMany(p => p.MenuItems)
                    .HasForeignKey(d => d.RestaurantId);
            });

            modelBuilder.Entity<Order>(entity =>
            {
                entity.ToTable("Order");

                entity.Property(e => e.Id).HasColumnType("guid");

                entity.Property(e => e.CustomerId)
                    .IsRequired()
                    .HasColumnType("guid");

                entity.Property(e => e.RestaurantId)
                    .IsRequired()
                    .HasColumnType("guid");

                entity.Property(e => e.StatusId).HasColumnType("int");

                entity.HasOne(d => d.Customer)
                    .WithMany(p => p.Orders)
                    .HasForeignKey(d => d.CustomerId);

                entity.HasOne(d => d.Restaurant)
                    .WithMany(p => p.Orders)
                    .HasForeignKey(d => d.RestaurantId);
            });

            modelBuilder.Entity<OrderItem>(entity =>
            {
                entity.ToTable("OrderItem");

                entity.Property(e => e.Id).HasColumnType("guid");

                entity.Property(e => e.MenuItemDescription)
                    .IsRequired()
                    .HasColumnType("nvarchar(1000)");

                entity.Property(e => e.MenuItemName)
                    .IsRequired()
                    .HasColumnType("nvarchar(100)");

                entity.Property(e => e.OrderId)
                    .IsRequired()
                    .HasColumnType("guid");

                entity.Property(e => e.PricePerItem)
                    .IsRequired()
                    .HasColumnType("decimal(9, 2)");

                entity.Property(e => e.Quantity).HasColumnType("int");

                entity.HasOne(d => d.Order)
                    .WithMany(p => p.OrderItems)
                    .HasForeignKey(d => d.OrderId);
            });

            modelBuilder.Entity<Restaurant>(entity =>
            {
                entity.ToTable("Restaurant");

                entity.Property(e => e.Id).HasColumnType("guid");

                entity.Property(e => e.AddressCity)
                    .IsRequired()
                    .HasColumnType("nvarchar(100)");

                entity.Property(e => e.AddressCityZip)
                    .IsRequired()
                    .HasColumnType("nvarchar(20)");

                entity.Property(e => e.AddressStreet)
                    .IsRequired()
                    .HasColumnType("nvarchar(200)");

                entity.Property(e => e.Description)
                    .IsRequired()
                    .HasColumnType("nvarchar(2000)");

                entity.Property(e => e.Name)
                    .IsRequired()
                    .HasColumnType("nvarchar(100)");

                entity.Property(e => e.OwnerId)
                    .IsRequired()
                    .HasColumnType("guid");

                entity.Property(e => e.PhoneNumber)
                    .IsRequired()
                    .HasColumnType("nvarchar(50)");

                entity.HasOne(d => d.Owner)
                    .WithMany(p => p.Restaurants)
                    .HasForeignKey(d => d.OwnerId);
            });

            modelBuilder.Entity<User>(entity =>
            {
                entity.ToTable("User");

                entity.Property(e => e.Id).HasColumnType("guid");

                entity.Property(e => e.AddressCity)
                    .IsRequired()
                    .HasColumnType("nvarchar(100)");

                entity.Property(e => e.AddressCityZip)
                    .IsRequired()
                    .HasColumnType("nvarchar(20)");

                entity.Property(e => e.AddressStreet)
                    .IsRequired()
                    .HasColumnType("nvarchar(200)");

                entity.Property(e => e.Email)
                    .IsRequired()
                    .HasColumnType("nvarchar(100)");

                entity.Property(e => e.FirstName)
                    .IsRequired()
                    .HasColumnType("nvarchar(100)");

                entity.Property(e => e.IsRestaurantOwner)
                    .IsRequired()
                    .HasColumnType("bit")
                    .HasDefaultValueSql("0");

                entity.Property(e => e.LastName)
                    .IsRequired()
                    .HasColumnType("nvarchar(100)");

                entity.Property(e => e.PasswordHash)
                    .IsRequired()
                    .HasColumnType("varchar(1000)");

                entity.Property(e => e.PasswordSalt)
                    .IsRequired()
                    .HasColumnType("varchar(64)");
            });

            OnModelCreatingPartial(modelBuilder);
        }

        partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
    }
}
