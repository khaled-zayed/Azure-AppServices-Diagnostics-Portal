using System.Reflection;
using Microsoft.AspNetCore;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;

namespace AppLensV3
{
    public class Program
    {
        public static void Main(string[] args)
        {
            BuildWebHost(args).Run();
        }

        public static IWebHost BuildWebHost(string[] args)
        {
            var config = new ConfigurationBuilder()
            .AddCommandLine(args)
            .Build();

            var assemblyName = typeof(Startup).GetTypeInfo().Assembly.FullName;

            return
            WebHost.CreateDefaultBuilder(args)
                .UseConfiguration(config)
                .UseStartup(assemblyName)
                .Build();
        }
    }
}
