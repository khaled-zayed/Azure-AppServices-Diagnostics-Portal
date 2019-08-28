using System.IO;
using System.Linq;
using AppLensV3.Services;
using AppLensV3.Services.DiagnosticClientService;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.AzureAD.UI;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Authorization;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using Microsoft.IdentityModel.Tokens.Saml2;
using Microsoft.AspNetCore.Authorization;
using AppLensV3.Authorization;
using System.Collections.Generic;

namespace AppLensV3
{
    public class Startup
    {
        public Startup(IHostingEnvironment env)
        {
            var builder = new ConfigurationBuilder()
                .SetBasePath(env.ContentRootPath)
                .AddJsonFile("appsettings.json", optional: false, reloadOnChange: true)
                .AddJsonFile($"appsettings.{env.EnvironmentName}.json", optional: true)
                .AddEnvironmentVariables();

            if (env.IsDevelopment())
            {
                builder.AddApplicationInsightsSettings(developerMode: true);
            }

            Configuration = builder.Build();
        }

        public IConfiguration Configuration { get; }

        // This method gets called by the runtime. Use this method to add services to the container.
        public void ConfigureServices(IServiceCollection services)
        {
            services.AddApplicationInsightsTelemetry(Configuration);

            services.AddSingleton(Configuration);

            services.AddSingleton<IObserverClientService, SupportObserverClientService>();
            services.AddSingleton<IDiagnosticClientService, DiagnosticClient>();
            services.AddSingleton<IGithubClientService, GithubClientService>();
            services.AddSingleton<IKustoQueryService, KustoQueryService>();
            services.AddSingleton<IOutageCommunicationService, OutageCommunicationService>();
            services.AddSingleton<ILocalDevelopmentClientService, LocalDevelopmentClientService>();
            services.AddSingleton<IEmailNotificationService, EmailNotificationService>();
            services.AddSingleton<IGraphClientService, GraphClientService>();
            services.AddSingleton<ISupportTopicService, SupportTopicService>();
            services.AddSingleton<ISelfHelpContentService, SelfHelpContentService>();
            services.AddSingleton<IFreshChatClientService, FreshChatClientService>();

            services.AddMemoryCache();
            services.AddMvc();
            services.AddHttpContextAccessor();

            GraphTokenService.Instance.Initialize(Configuration);
            KustoTokenRefreshService.Instance.Initialize(Configuration);
            AuthorizationTokenService.Instance.Initialize(Configuration);

            // If we are using runtime host directly
            if (Configuration.GetValue<bool>("DiagnosticRole:UseAppService"))
            {
                DiagnosticClientToken.Instance.Initialize(Configuration);
            }

            services.AddAuthentication(auth =>
            {
                auth.DefaultScheme = AzureADDefaults.BearerAuthenticationScheme;
            })
            .AddAzureADBearer(options =>
            {
                Configuration.Bind("AzureAd", options);
            });
            services.AddAuthorization(options => {
                var applensAccess = new SecurityGroupConfig();
                var applensTesters = new SecurityGroupConfig();
                Configuration.Bind("ApplensAccess", applensAccess);
                Configuration.Bind("ApplensTesters", applensTesters);

                options.AddPolicy(applensAccess.GroupName, policy => {
                   policy.Requirements.Add(new SecurityGroupRequirement(applensAccess.GroupName, applensAccess.GroupId));
                });
                options.AddPolicy(applensTesters.GroupName, policy => {
                    policy.Requirements.Add(new SecurityGroupRequirement(applensTesters.GroupName, applensTesters.GroupId));
                });
            });

            services.AddSingleton<IAuthorizationHandler, SecurityGroupHandler>();

            if (Configuration["ServerMode"] == "internal")
            {
                services.AddTransient<IFilterProvider, LocalFilterProvider>();
            }
        }

        // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
        public void Configure(IApplicationBuilder app, IHostingEnvironment env)
        {
            if (env.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();
            }

            app.UseCors(cors =>
                cors
                .AllowAnyHeader()
                .AllowAnyMethod()
                .AllowAnyOrigin()
                .WithExposedHeaders(new string[] { "diag-script-etag" })
            );

            app.UseAuthentication();

            app.UseMvc();

            app.Use(async (context, next) =>
            {
                await next();
                if (context.Response.StatusCode == 404 &&
                    !Path.HasExtension(context.Request.Path.Value) &&
                    !context.Request.Path.Value.StartsWith("/api/"))
                {
                    context.Request.Path = "/index.html";
                    await next();
                }
            });

            app.UseDefaultFiles();
            app.UseStaticFiles();
        }
    }

    // Use this to skip Auth on local server
    public class LocalFilterProvider : IFilterProvider
    {
        public int Order
        {
            get
            {
                return -1500;
            }
        }

        public void OnProvidersExecuted(FilterProviderContext context)
        {
        }

        public void OnProvidersExecuting(FilterProviderContext context)
        {
            // remove authorize filters
            var authFilters = context.Results.Where(x => x.Descriptor.Filter.GetType() == typeof(AuthorizeFilter)).ToList();
            foreach (var filter in authFilters)
            {
                context.Results.Remove(filter);
            }
        }
    }
}