using System.Net;
using System.Net.Mail;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.UI.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Models;
using QuickPharmaPlus.Server.Identity;
using QuickPharmaPlus.Server.Models;
using QuickPharmaPlus.Server.Repositories.Implementation;
using QuickPharmaPlus.Server.Repositories.Interface;
using QuickPharmaPlus.Server.Services;
using Stripe;

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

            // Configure token lifespan for password reset and email confirmation
            builder.Services.Configure<DataProtectionTokenProviderOptions>(opt =>
            {
                opt.TokenLifespan = TimeSpan.FromHours(2);
            });




            // Add to service registration
            builder.Services.AddDistributedMemoryCache();
            builder.Services.AddSession(options =>
            {
                options.IdleTimeout = TimeSpan.FromMinutes(20);
                options.Cookie.HttpOnly = true;
                options.Cookie.IsEssential = true;
            });


            builder.Services.AddControllers()
                .AddJsonOptions(opts =>
                {
                    // Prevent System.Text.Json from throwing on entity navigation cycles
                    opts.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;

                    // Increase allowed depth for very deep graphs (optional)
                    opts.JsonSerializerOptions.MaxDepth = 64;
                });
            builder.Services.AddEndpointsApiExplorer();
            builder.Services.AddSwaggerGen(c =>
            {
                c.AddSecurityDefinition("cookieAuth", new OpenApiSecurityScheme
                {
                    Name = ".AspNetCore.Identity.Application",
                    Type = SecuritySchemeType.ApiKey,
                    In = ParameterLocation.Cookie,
                    Description = "Auth cookie for Swagger"
                });

                c.AddSecurityRequirement(new OpenApiSecurityRequirement {
        {
            new OpenApiSecurityScheme {
                Reference = new OpenApiReference {
                    Type = ReferenceType.SecurityScheme,
                    Id = "cookieAuth"
                }
            },
            new string[] {}
        }
    });
            });


            // 4) CORS FOR REACT
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


            // 5) COOKIES FOR REACT FRONTEND
            //adding application cookies
            builder.Services.ConfigureApplicationCookie(options =>
            {
                options.Cookie.HttpOnly = true;
                options.Cookie.SameSite = SameSiteMode.None;
                options.Cookie.SecurePolicy = CookieSecurePolicy.Always;
                // return 401 instead of redirect
                options.Events.OnRedirectToLogin = ctx => { ctx.Response.StatusCode = 401; return Task.CompletedTask; };
            });

            // register email sender: use DevEmailSender in Development, SmtpEmailSender in Production
            builder.Services.AddTransient<IEmailSender, SendGridEmailSender>();


            //adding the repostries 
            builder.Services.AddScoped<ICategoryRepository, CategoryRepository>();
            builder.Services.AddScoped<IUserRepository, UserRepository>();
            builder.Services.AddScoped<IRoleRepository, RoleRepository>();
            builder.Services.AddScoped<ICityRepository, CityRepository>();
            builder.Services.AddScoped<IAddressRepository, AddressRepository>();
            builder.Services.AddScoped<ISupplierRepository, SupplierRepository>();
            builder.Services.AddScoped<IInventoryRepository, InventoryRepository>();
            builder.Services.AddScoped<IProductRepository, ProductRepository>();
            builder.Services.AddScoped<IReorderRepository, ReorderRepository>();
            builder.Services.AddScoped<ISupplierOrderRepository, SupplierOrderRepository>();
            builder.Services.AddScoped<IQuickPharmaLogRepository, QuickPharmaLogRepository>();
            builder.Services.AddScoped<ISafetyCheckRepository, SafetyCheckRepository>();
            builder.Services.AddScoped<IAdminDashboardRepository, AdminDashboardRepository>();

            // 6) Stripe configuration (test secret key from appsettings.json)
            var stripeSection = builder.Configuration.GetSection("Stripe");
            StripeConfiguration.ApiKey = stripeSection["SecretKey"];




            var app = builder.Build();

            // continue with middleware pipeline
            app.UseDefaultFiles();
            app.UseStaticFiles();

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
            app.UseRouting();
            app.UseSession();
            app.UseAuthentication();
            app.UseAuthorization();

            app.MapControllers();
            app.MapFallbackToFile("index.html");
            

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


            // Admin seeding  
            await CreateUser(userManager, "hassan.alkhalifa@gmail.com", "Admin123!", "Admin");

            // Managers seeding
            await CreateUser(userManager, "mansoor.alansari@gmail.com", "Manager123!", "Manager");
            await CreateUser(userManager, "fatima.alqattan@gmail.com", "Manager123!", "Manager");
            await CreateUser(userManager, "ali.alsayegh@gmail.com", "Manager123!", "Manager");
            await CreateUser(userManager, "maryam.aljaber@gmail.com", "Manager123!", "Manager");
            await CreateUser(userManager, "jassim.alrumaihi@gmail.com", "Manager123!", "Manager");

            // For testing reset/forgot password
            await CreateUser(userManager, "zainabalawi08@gmail.com", "User123!", "Manager");
            await CreateUser(userManager, "z.alawi@outlook.com", "Zainab123!", "Pharmacist");

            // Pharmacists seeding
            await CreateUser(userManager, "ahmed.alhaddad@gmail.com", "Pharma123!", "Pharmacist");
            await CreateUser(userManager, "noora.almannai@gmail.com", "Pharma123!", "Pharmacist");
            await CreateUser(userManager, "yousef.saleh@gmail.com", "Pharma123!", "Pharmacist");
            await CreateUser(userManager, "maha.alkhaldi@gmail.com", "Pharma123!", "Pharmacist");
            await CreateUser(userManager, "hussain.qamber@gmail.com", "Pharma123!", "Pharmacist");
            await CreateUser(userManager, "aisha.alshoaibi@gmail.com", "Pharma123!", "Pharmacist");
            await CreateUser(userManager, "salman.almahroos@gmail.com", "Pharma123!", "Pharmacist");
            await CreateUser(userManager, "fatema.alaradi@gmail.com", "Pharma123!", "Pharmacist");
            await CreateUser(userManager, "mohamed.alfardan@gmail.com", "Pharma123!", "Pharmacist");
            await CreateUser(userManager, "zainab.almutawa@gmail.com", "Pharma123!", "Pharmacist");
            await CreateUser(userManager, "talal.aljishi@gmail.com", "Pharma123!", "Pharmacist");
            await CreateUser(userManager, "ruqaya.altajer@gmail.com", "Pharma123!", "Pharmacist");
            await CreateUser(userManager, "khalid.alzayani@gmail.com", "Pharma123!", "Pharmacist");
            await CreateUser(userManager, "laila.alhashemi@gmail.com", "Pharma123!", "Pharmacist");
            await CreateUser(userManager, "salwa.aldossary@gmail.com", "Pharma123!", "Pharmacist");
            await CreateUser(userManager, "hamza.almulla@gmail.com", "Pharma123!", "Pharmacist");
            await CreateUser(userManager, "jalila.aljowder@gmail.com", "Pharma123!", "Pharmacist");
            await CreateUser(userManager, "ammar.alshirawi@gmail.com", "Pharma123!", "Pharmacist");
            await CreateUser(userManager, "huda.alsubaie@gmail.com", "Pharma123!", "Pharmacist");
            await CreateUser(userManager, "nasser.alnoaimi@gmail.com", "Pharma123!", "Pharmacist");
            await CreateUser(userManager, "sumaya.albuainain@gmail.com", "Pharma123!", "Pharmacist");
            await CreateUser(userManager, "rashid.aleid@gmail.com", "Pharma123!", "Pharmacist");
            await CreateUser(userManager, "maryam.almatar@gmail.com", "Pharma123!", "Pharmacist");
            await CreateUser(userManager, "jaber.alaali@gmail.com", "Pharma123!", "Pharmacist");
            await CreateUser(userManager, "dalal.alsaffar@gmail.com", "Pharma123!", "Pharmacist");

            // Drivers seeding
            await CreateUser(userManager, "ramesh.kumar@gmail.com", "Driver123!", "Driver");
            await CreateUser(userManager, "sanjay.patel@gmail.com", "Driver123!", "Driver");
            await CreateUser(userManager, "arjun.nair@gmail.com", "Driver123!", "Driver");
            await CreateUser(userManager, "vijay.menon@gmail.com", "Driver123!", "Driver");
            await CreateUser(userManager, "deepak.singh@gmail.com", "Driver123!", "Driver");

            // Customers seeding
            await CreateUser(userManager, "layla.hassan@gmail.com", "Customer123!", "Customer");
            await CreateUser(userManager, "john.mitchell@gmail.com", "Customer123!", "Customer");
            await CreateUser(userManager, "sara.alm@gmail.com", "Customer123!", "Customer");
            await CreateUser(userManager, "michael.turner@gmail.com", "Customer123!", "Customer");
            await CreateUser(userManager, "aisha.rahman@gmail.com", "Customer123!", "Customer");
            await CreateUser(userManager, "david.collins@gmail.com", "Customer123!", "Customer");
            await CreateUser(userManager, "fatima.isa@gmail.com", "Customer123!", "Customer");
            await CreateUser(userManager, "adam.williams@gmail.com", "Customer123!", "Customer");
            await CreateUser(userManager, "mariyam.alfarsi@gmail.com", "Customer123!", "Customer");
            await CreateUser(userManager, "james.harrison@gmail.com", "Customer123!", "Customer");
            await CreateUser(userManager, "huda.saleem@gmail.com", "Customer123!", "Customer");
            await CreateUser(userManager, "daniel.reed@gmail.com", "Customer123!", "Customer");
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
