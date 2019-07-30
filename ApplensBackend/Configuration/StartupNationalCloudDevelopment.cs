using System.IO;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace AppLensV3.Configuration
{
    /// <summary>
    /// Startup class for development environment national cloud. Runtime will use this class when ASPNETCORE_ENVIRONMENT = NationalCloudDevelopment.
    /// </summary>
    public class StartupNationalCloudDevelopment : StartupNationalCloud
    {
        /// <summary>
        /// Initializes a new instance of the <see cref="StartupNationalCloudDevelopment"/> class.
        /// </summary>
        /// <param name="configuration">DI Configuration.</param>
        public StartupNationalCloudDevelopment(IConfiguration configuration, IHostingEnvironment env)
            : base(configuration, env)
        {
        }
    }
}
