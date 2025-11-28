using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using QuickPharmaPlus.Server.Identity;
using QuickPharmaPlus.Server.Models;

namespace QuickPharmaPlus.Server
{
    public class Program
    {
        public static async Task Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            // 1) MAIN DATABASE CONTEXT (Your scaffolded DB)
            builder.Services.AddDbContext<QuickPharmaPlusDbContext>(options =>
                options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

            // 2) IDENTITY DATABASE CONTEXT
            builder.Services.AddDbContext<IdentityContext>(options =>
                options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

            // 3) ADD IDENTITY
            builder.Services.AddIdentity<ApplicationUser, IdentityRole>()
                .AddEntityFrameworkStores<IdentityContext>()
                .AddDefaultTokenProviders();

            // 4) COOKIES FOR REACT FRONTEND
            builder.Services.ConfigureApplicationCookie(options =>
            {
                options.Cookie.HttpOnly = true;
                options.Cookie.SameSite = SameSiteMode.None;
                options.Cookie.SecurePolicy = CookieSecurePolicy.Always;
                options.LoginPath = "/api/auth/unauthorized";
            });

            builder.Services.AddControllers();
            builder.Services.AddEndpointsApiExplorer();
            builder.Services.AddSwaggerGen();

            // 5) CORS FOR REACT
            builder.Services.AddCors(options =>
            {
                options.AddPolicy("AllowReactApp", policy =>
                    policy.AllowAnyOrigin()
                          .AllowAnyHeader()
                          .AllowAnyMethod()
                );
            });

            var app = builder.Build();

            // 6) SEED ROLES + USERS
            await SeedRoles(app);
            await SeedTestUsers(app);

            app.UseDefaultFiles();
            app.UseStaticFiles();

            if (app.Environment.IsDevelopment())
            {
                app.UseSwagger();
                app.UseSwaggerUI();
            }

            app.UseHttpsRedirection();

            app.UseCors("AllowReactApp");
            app.UseAuthentication();
            app.UseAuthorization();

            app.MapControllers();
            app.MapFallbackToFile("/index.html");

            app.Run();
        }

        // ROLE SEEDING
        private static async Task SeedRoles(WebApplication app)
        {
            using var scope = app.Services.CreateScope();
            var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();

            string[] roles = { "Admin", "Manager", "Pharmacist", "Driver", "Customer" };

            foreach (var roleName in roles)
            {
                if (!await roleManager.RoleExistsAsync(roleName))
                {
                    await roleManager.CreateAsync(new IdentityRole(roleName));
                    Console.WriteLine($"Role created: {roleName}");
                }
            }
        }

        // USER SEEDING
        private static async Task SeedTestUsers(WebApplication app)
        {
            using var scope = app.Services.CreateScope();
            var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();

            await CreateUser(userManager, "admin@demo.com", "Admin123!", "Admin");
            await CreateUser(userManager, "manager@demo.com", "Manager123!", "Manager");
            await CreateUser(userManager, "pharmacist@demo.com", "Pharma123!", "Pharmacist");
            await CreateUser(userManager, "driver@demo.com", "Driver123!", "Driver");
            await CreateUser(userManager, "customer@demo.com", "Customer123!", "Customer");
        }

        // HELPER METHOD FOR USER CREATION
        private static async Task CreateUser(UserManager<ApplicationUser> userManager, string email, string password, string role)
        {
            if (await userManager.FindByEmailAsync(email) == null)
            {
                var user = new ApplicationUser
                {
                    Email = email,
                    UserName = email
                };

                var result = await userManager.CreateAsync(user, password);

                if (result.Succeeded)
                {
                    await userManager.AddToRoleAsync(user, role);
                    Console.WriteLine($"Seeded user: {email} ({role})");
                }
                else
                {
                    Console.WriteLine($"Failed to create {role} user {email}:");
                    foreach (var error in result.Errors)
                    {
                        Console.WriteLine(error.Description);
                    }
                }
            }
        }
    }
}
