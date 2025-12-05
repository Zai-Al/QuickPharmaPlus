using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using QuickPharmaPlus.Server.Identity;
using QuickPharmaPlus.Server.Models;
using QuickPharmaPlus.Server.Repositories.Implementation;
using QuickPharmaPlus.Server.Repositories.Interface;

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
            // FIX — Prevent Identity from sending HTML redirect pages to API clients
            builder.Services.ConfigureApplicationCookie(options =>
            {
                options.Cookie.HttpOnly = true;
                options.Cookie.SameSite = SameSiteMode.None;
                options.Cookie.SecurePolicy = CookieSecurePolicy.Always;

                // disable redirect response — return 401 instead
                options.Events.OnRedirectToLogin = context =>
                {
                    context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                    return Task.CompletedTask;
                };

                options.Events.OnRedirectToAccessDenied = context =>
                {
                    context.Response.StatusCode = StatusCodes.Status403Forbidden;
                    return Task.CompletedTask;
                };
            });


            builder.Services.AddControllers();
            builder.Services.AddEndpointsApiExplorer();
            builder.Services.AddSwaggerGen();

            // 5) CORS FOR REACT
            // Read allowed origin from configuration (appsettings or env). Example: "https://localhost:5173"
            var reactOrigin = builder.Configuration["ReactDevOrigin"] ?? "https://localhost:5173";
            builder.Services.AddCors(options =>
            {
                options.AddPolicy("AllowReactApp", policy =>
                    policy.WithOrigins(reactOrigin)   // MUST be explicit when allowing credentials
                          .AllowAnyHeader()
                          .AllowAnyMethod()
                          .AllowCredentials()
                );
            });

            //adding application cookies
            builder.Services.ConfigureApplicationCookie(options =>
            {
                options.Cookie.SameSite = SameSiteMode.None;
                options.Cookie.SecurePolicy = CookieSecurePolicy.Always;
                // return 401 instead of redirect
                options.Events.OnRedirectToLogin = ctx => { ctx.Response.StatusCode = 401; return Task.CompletedTask; };
            });

            //adding the repostries 
            builder.Services.AddScoped<CategoryRepository>();
            builder.Services.AddScoped<IUserRepository, UserRepository>();



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

            // Apply CORS before authentication/authorization
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


            //Admin seeding  
            await CreateUser(userManager, "hassan.alkhalifa@quickpharmaplus.com", "Admin123!", "Admin");
            
            //Managers seeding
            await CreateUser(userManager, "mansoor.alansari@quickpharmaplus.com", "Manager123!", "Manager");
            await CreateUser(userManager, "fatima.alqattan@quickpharmaplus.com", "Manager123!", "Manager");
            await CreateUser(userManager, "ali.alsayegh@quickpharmaplus.com", "Manager123!", "Manager");
            await CreateUser(userManager, "maryam.aljaber@quickpharmaplus.com", "Manager123!", "Manager");
            await CreateUser(userManager, "jassim.alrumaihi@quickpharmaplus.com", "Manager123!", "Manager");

            //for testing reset/forgot password
            await CreateUser(userManager, "zainabalawi08@gmail.com", "User123!", "Manager");

            //Pharmacists seeding
            await CreateUser(userManager, "ahmed.alhaddad@quickpharmaplus.com", "Pharma123!", "Pharmacist");
            await CreateUser(userManager, "noora.almannai@quickpharmaplus.com", "Pharma123!", "Pharmacist");
            await CreateUser(userManager, "yousef.saleh@quickpharmaplus.com", "Pharma123!", "Pharmacist");
            await CreateUser(userManager, "maha.alkhaldi@quickpharmaplus.com", "Pharma123!", "Pharmacist");
            await CreateUser(userManager, "hussain.qamber@quickpharmaplus.com", "Pharma123!", "Pharmacist");
            await CreateUser(userManager, "aisha.alshoaibi@quickpharmaplus.com", "Pharma123!", "Pharmacist");
            await CreateUser(userManager, "salman.almahroos@quickpharmaplus.com", "Pharma123!", "Pharmacist");
            await CreateUser(userManager, "fatema.alaradi@quickpharmaplus.com", "Pharma123!", "Pharmacist");
            await CreateUser(userManager, "mohamed.alfardan@quickpharmaplus.com", "Pharma123!", "Pharmacist");
            await CreateUser(userManager, "zainab.almutawa@quickpharmaplus.com", "Pharma123!", "Pharmacist");
            await CreateUser(userManager, "talal.aljishi@quickpharmaplus.com", "Pharma123!", "Pharmacist");
            await CreateUser(userManager, "ruqaya.altajer@quickpharmaplus.com", "Pharma123!", "Pharmacist");
            await CreateUser(userManager, "khalid.alzayani@quickpharmaplus.com", "Pharma123!", "Pharmacist");
            await CreateUser(userManager, "laila.alhashemi@quickpharmaplus.com", "Pharma123!", "Pharmacist");
            await CreateUser(userManager, "salwa.aldossary@quickpharmaplus.com", "Pharma123!", "Pharmacist");
            await CreateUser(userManager, "hamza.almulla@quickpharmaplus.com", "Pharma123!", "Pharmacist");
            await CreateUser(userManager, "jalila.aljowder@quickpharmaplus.com", "Pharma123!", "Pharmacist");
            await CreateUser(userManager, "ammar.alshirawi@quickpharmaplus.com", "Pharma123!", "Pharmacist");
            await CreateUser(userManager, "huda.alsubaie@quickpharmaplus.com", "Pharma123!", "Pharmacist");
            await CreateUser(userManager, "nasser.alnoaimi@quickpharmaplus.com", "Pharma123!", "Pharmacist");
            await CreateUser(userManager, "sumaya.albuainain@quickpharmaplus.com", "Pharma123!", "Pharmacist");
            await CreateUser(userManager, "rashid.aleid@quickpharmaplus.com", "Pharma123!", "Pharmacist");
            await CreateUser(userManager, "maryam.almatar@quickpharmaplus.com", "Pharma123!", "Pharmacist");
            await CreateUser(userManager, "jaber.alaali@quickpharmaplus.com", "Pharma123!", "Pharmacist");
            await CreateUser(userManager, "dalal.alsaffar@quickpharmaplus.com", "Pharma123!", "Pharmacist");

            //Drivers seeding
            await CreateUser(userManager, "ramesh.kumar@quickpharmaplus.com", "Driver123!", "Driver");
            await CreateUser(userManager, "sanjay.patel@quickpharmaplus.com", "Driver123!", "Driver");
            await CreateUser(userManager, "arjun.nair@quickpharmaplus.com", "Driver123!", "Driver");
            await CreateUser(userManager, "vijay.menon@quickpharmaplus.com", "Driver123!", "Driver");
            await CreateUser(userManager, "deepak.singh@quickpharmaplus.com", "Driver123!", "Driver");

            //Customers seeding
            await CreateUser(userManager, "layla.hassan@gmail.com", "Customer123!", "Customer");
            await CreateUser(userManager, "john.mitchell@outlook.com", "Customer123!", "Customer");
            await CreateUser(userManager, "sara.alm@gmail.com", "Customer123!", "Customer");
            await CreateUser(userManager, "michael.turner@yahoo.com", "Customer123!", "Customer");
            await CreateUser(userManager, "aisha.rahman@gmail.com", "Customer123!", "Customer");
            await CreateUser(userManager, "david.collins@hotmail.com", "Customer123!", "Customer");
            await CreateUser(userManager, "fatima.isa@gmail.com", "Customer123!", "Customer");
            await CreateUser(userManager, "adam.williams@outlook.com", "Customer123!", "Customer");
            await CreateUser(userManager, "mariyam.alfarsi@gmail.com", "Customer123!", "Customer");
            await CreateUser(userManager, "james.harrison@yahoo.com", "Customer123!", "Customer");
            await CreateUser(userManager, "huda.saleem@gmail.com", "Customer123!", "Customer");
            await CreateUser(userManager, "daniel.reed@outlook.com", "Customer123!", "Customer");
            await CreateUser(userManager, "noura.alsaad@gmail.com", "Customer123!", "Customer");
            await CreateUser(userManager, "emily.johnson@gmail.com", "Customer123!", "Customer");
            await CreateUser(userManager, "ahmed.yousif@gmail.com", "Customer123!", "Customer");

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
