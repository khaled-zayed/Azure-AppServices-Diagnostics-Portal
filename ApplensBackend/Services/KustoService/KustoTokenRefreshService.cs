using AppLensV3.Helpers;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Clients.ActiveDirectory;
using AppLensV3.Services.TokenService;
using System;

namespace AppLensV3.Services
{
    public class KustoTokenRefreshService : TokenServiceBase
    {
        private static readonly Lazy<KustoTokenRefreshService> instance = new Lazy<KustoTokenRefreshService>(() => new KustoTokenRefreshService());
        public static KustoTokenRefreshService Instance => instance.Value;
        protected override AuthenticationContext AuthenticationContext { get; set; }
        protected override ClientCredential ClientCredential { get; set; }
        protected override string Resource { get; set; }

        public void Initialize(IConfiguration configuration)
        {
            AuthenticationContext = new AuthenticationContext(KustoConstants.MicrosoftTenantAuthorityUrl);
            ClientCredential = new ClientCredential(configuration["Kusto:ClientId"], configuration["Kusto:AppKey"]);
            Resource = KustoConstants.DefaultKustoEndpoint;
            StartTokenRefresh();
        }
    }
}
