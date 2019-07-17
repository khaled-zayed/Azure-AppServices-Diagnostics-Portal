using AppLensV3.Helpers;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Clients.ActiveDirectory;
using AppLensV3.Services.TokenService;
using System;

namespace AppLensV3.Services
{
    public class GraphTokenService : TokenServiceBase
    {
        private static readonly Lazy<GraphTokenService> instance = new Lazy<GraphTokenService>(() => new GraphTokenService());

        public static GraphTokenService Instance => instance.Value;

        protected override AuthenticationContext AuthenticationContext { get; set; }
        protected override ClientCredential ClientCredential { get; set; }
        protected override string Resource { get; set; }

        public void Initialize(IConfiguration configuration)
        {
            AuthenticationContext = new AuthenticationContext(GraphConstants.MicrosoftTenantAuthorityUrl);
            ClientCredential = new ClientCredential(configuration["Graph:ClientId"], configuration["Graph:AppKey"]);
            Resource = GraphConstants.DefaultGraphEndpoint;
            StartTokenRefresh();
        }
    }
}
