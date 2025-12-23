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

            // =========================
            // DATABASE CONTEXTS
            // =========================
            builder.Services.AddDbContext<QuickPharmaPlusDbContext>(options =>
                options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

            builder.Services.AddDbContext<IdentityContext>(options =>
                options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

            // =========================
            // IDENTITY
            // =========================
            builder.Services.AddIdentity<ApplicationUser, IdentityRole>()
                .AddEntityFrameworkStores<IdentityContext>()
                .AddDefaultTokenProviders();

            builder.Services.Configure<DataProtectionTokenProviderOptions>(opt =>
            {
                opt.TokenLifespan = TimeSpan.FromHours(2);
            });

            // =========================
            // SESSION
            // =========================
            builder.Services.AddDistributedMemoryCache();
            builder.Services.AddSession(options =>
            {
                options.IdleTimeout = TimeSpan.FromMinutes(20);
                options.Cookie.HttpOnly = true;
                options.Cookie.IsEssential = true;
            });

            // =========================
            // CONTROLLERS + JSON
            // =========================
            builder.Services.AddControllers()
                .AddJsonOptions(opts =>
                {
                    opts.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
                    opts.JsonSerializerOptions.MaxDepth = 64;
                });

            builder.Services.AddEndpointsApiExplorer();

            // =========================
            // SWAGGER
            // =========================
            builder.Services.AddSwaggerGen(c =>
            {
                c.AddSecurityDefinition("cookieAuth", new OpenApiSecurityScheme
                {
                    Name = ".AspNetCore.Identity.Application",
                    Type = SecuritySchemeType.ApiKey,
                    In = ParameterLocation.Cookie,
                    Description = "Auth cookie for Swagger"
                });

                c.AddSecurityRequirement(new OpenApiSecurityRequirement
                {
                    {
                        new OpenApiSecurityScheme
                        {
                            Reference = new OpenApiReference
                            {
                                Type = ReferenceType.SecurityScheme,
                                Id = "cookieAuth"
                            }
                        },
                        Array.Empty<string>()
                    }
                });
            });

            // =========================
            // CORS (REACT)
            // =========================
            var reactOrigin = builder.Configuration["ReactDevOrigin"] ?? "https://localhost:5173";
            builder.Services.AddCors(options =>
            {
                options.AddPolicy("AllowReactApp", policy =>
                    policy.WithOrigins("https://localhost:5173")
                          .AllowAnyHeader()
                          .AllowAnyMethod()
                          .AllowCredentials());
            });

            // =========================
            // COOKIE AUTH (CRITICAL FIX)
            // =========================
            builder.Services.ConfigureApplicationCookie(options =>
            {
                options.Cookie.HttpOnly = true;
                options.Cookie.SameSite = SameSiteMode.None;
                options.Cookie.SecurePolicy = CookieSecurePolicy.Always;

                options.Events.OnRedirectToLogin = ctx =>
                {
                    if (ctx.Request.Path.StartsWithSegments("/api"))
                    {
                        ctx.Response.StatusCode = StatusCodes.Status401Unauthorized;
                        return Task.CompletedTask;
                    }

                    ctx.Response.Redirect(ctx.RedirectUri);
                    return Task.CompletedTask;
                };

                options.Events.OnRedirectToAccessDenied = ctx =>
                {
                    if (ctx.Request.Path.StartsWithSegments("/api"))
                    {
                        ctx.Response.StatusCode = StatusCodes.Status403Forbidden;
                        return Task.CompletedTask;
                    }

                    ctx.Response.Redirect(ctx.RedirectUri);
                    return Task.CompletedTask;
                };
            });

            // =========================
            // EMAIL
            // =========================
            builder.Services.AddTransient<IEmailSender, SendGridEmailSender>();

            // =========================
            // REPOSITORIES
            // =========================
            builder.Services.AddScoped<ICategoryRepository, CategoryRepository>();
            builder.Services.AddScoped<IUserRepository, UserRepository>();
            builder.Services.AddScoped<IRoleRepository, RoleRepository>();
            builder.Services.AddScoped<ICityRepository, CityRepository>();
            builder.Services.AddScoped<IAddressRepository, AddressRepository>();
            builder.Services.AddScoped<ISupplierRepository, SupplierRepository>();
            builder.Services.AddScoped<IInventoryRepository, InventoryRepository>();
            builder.Services.AddScoped<IProductRepository, ProductRepository>();
            builder.Services.AddScoped<IBranchRepository, BranchRepository>();
            builder.Services.AddScoped<IWishlistRepository, WishlistRepository>();
            builder.Services.AddScoped<ICartRepository, CartRepository>();
            builder.Services.AddScoped<IReorderRepository, ReorderRepository>();
            builder.Services.AddScoped<ISupplierOrderRepository, SupplierOrderRepository>();
            builder.Services.AddScoped<IQuickPharmaLogRepository, QuickPharmaLogRepository>();
            builder.Services.AddScoped<ISafetyCheckRepository, SafetyCheckRepository>();
            builder.Services.AddScoped<IAdminDashboardRepository, AdminDashboardRepository>();
            builder.Services.AddScoped<IHealthProfileIllnessRepository, HealthProfileIllnessRepository>();
            builder.Services.AddScoped<IHealthProfileLookupRepository, HealthProfileLookupRepository>();
            builder.Services.AddScoped<IHealthProfileAllergyRepository, HealthProfileAllergyRepository>();
            builder.Services.AddScoped<IPrescriptionRepository, PrescriptionRepository>();
            builder.Services.AddScoped<IManagerDashboardRepository, ManagerDashboardRepository>();
            builder.Services.AddScoped<IPharmacistDashboardRepository, PharmacistDashboardRepository>();
            builder.Services.AddScoped<IDriverDashboardRepository, DriverDashboardRepository>();
            builder.Services.AddScoped<IPrescriptionPlanRepository, PrescriptionPlanRepository>();
            builder.Services.AddScoped<IShippingRepository, ShippingRepository>();
            builder.Services.AddScoped<IPrescriptionPlanEmailLogService, PrescriptionPlanEmailLogService>();
            builder.Services.AddScoped<IOrderRepository, OrderRepository>();
            builder.Services.AddScoped<ICheckoutOrderRepository, CheckoutOrderRepository>();
            builder.Services.AddScoped<IOrderEmailService, OrderEmailService>();
            builder.Services.AddScoped<IIncompatibilityRepository, IncompatibilityRepository>();
            builder.Services.AddScoped<IAutomatedReorderEmailService, AutomatedReorderEmailService>();
            builder.Services.AddScoped<IPrescriptionNotificationEmailService, PrescriptionNotificationEmailService>();
            builder.Services.AddScoped<IDeliveryNotificationEmailService, DeliveryNotificationEmailService>();
            builder.Services.AddScoped<IDeliveryRequestRepository, DeliveryRequestRepository>();
            builder.Services.AddScoped<IReportRepository, ReportRepository>();

            // =========================
            // BACKGROUND SERVICES
            // =========================
            builder.Services.AddHostedService<QuickPharmaPlus.Server.Services.PrescriptionPlanEmailScheduler>();
            builder.Services.AddHostedService<QuickPharmaPlus.Server.Services.AutomatedReorderService>();

            // =========================
            // STRIPE
            // =========================
            var stripeSection = builder.Configuration.GetSection("Stripe");
            StripeConfiguration.ApiKey = stripeSection["SecretKey"];

            var app = builder.Build();

            // =========================
            // SEEDING
            // =========================
            await SeedRoles(app);
            await SeedTestUsers(app);

            // =========================
            // MIDDLEWARE PIPELINE (FIXED ORDER)
            // =========================
            if (app.Environment.IsDevelopment())
            {
                app.UseSwagger();
                app.UseSwaggerUI();
            }

            app.UseHttpsRedirection();
            app.UseStaticFiles();

            app.UseRouting();

            app.UseCors("AllowReactApp"); // Your CORS policy

            app.UseAuthentication();
            app.UseAuthorization();

            // Explicitly map API routes with higher priority
            app.MapControllerRoute(
                name: "api",
                pattern: "api/{controller}/{action=Index}/{id?}");

            app.MapControllers();

            // Then map the SPA fallback LAST
            app.MapFallbackToFile("index.html");

            app.Run();
        }

        // =========================
        // ROLE SEEDING
        // =========================
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
                }
            }
        }

        // =========================
        // USER SEEDING
        // =========================
        private static async Task SeedTestUsers(WebApplication app)
        {
            using var scope = app.Services.CreateScope();
            var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();

            // Admin seeding  
            await CreateUser(userManager, "hassan.alkhalifa@gmail.com", "Admin123!", "Admin");

            // Managers seeding
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

            // ===== BRANCH 1 =====
            await CreateUser(userManager, "amit.sharma.b1@gmail.com", "Driver123!", "Driver");
            await CreateUser(userManager, "rohit.verma.b1@gmail.com", "Driver123!", "Driver");
            await CreateUser(userManager, "kunal.mehta.b1@gmail.com", "Driver123!", "Driver");

            // ===== BRANCH 2 =====
            await CreateUser(userManager, "sameer.khan.b2@gmail.com", "Driver123!", "Driver");
            await CreateUser(userManager, "imran.ali.b2@gmail.com", "Driver123!", "Driver");
            await CreateUser(userManager, "faisal.hassan.b2@gmail.com", "Driver123!", "Driver");

            // ===== BRANCH 3 =====
            await CreateUser(userManager, "adnan.saeed.b3@gmail.com", "Driver123!", "Driver");
            await CreateUser(userManager, "yasir.malik.b3@gmail.com", "Driver123!", "Driver");
            await CreateUser(userManager, "omar.farooq.b3@gmail.com", "Driver123!", "Driver");

            // ===== BRANCH 4 =====
            await CreateUser(userManager, "salman.nadeem.b4@gmail.com", "Driver123!", "Driver");
            await CreateUser(userManager, "zubair.iqbal.b4@gmail.com", "Driver123!", "Driver");
            await CreateUser(userManager, "tariq.aziz.b4@gmail.com", "Driver123!", "Driver");

            // ===== BRANCH 5 =====
            await CreateUser(userManager, "fahad.mansoor.b5@gmail.com", "Driver123!", "Driver");
            await CreateUser(userManager, "adeel.butt.b5@gmail.com", "Driver123!", "Driver");
            await CreateUser(userManager, "usman.sheikh.b5@gmail.com", "Driver123!", "Driver");


            // Customers seeding
            await CreateUser(userManager, "layla.hassan.test@gmail.com", "Customer123!", "Customer");
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
                }
            }
        }
    }
}
