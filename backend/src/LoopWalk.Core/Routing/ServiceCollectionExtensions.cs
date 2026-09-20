using LoopWalk.Core.Geometry;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace LoopWalk.Core.Routing;

public static class ServiceCollectionExtensions
{
    /// <summary>Registers geometry, the Mapbox client and the loop generator.</summary>
    public static IServiceCollection AddLoopWalkCore(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddOptions<MapboxOptions>()
            .Bind(configuration.GetSection(MapboxOptions.SectionName))
            .ValidateDataAnnotations()
            .ValidateOnStart();

        services.AddOptions<LoopRouteOptions>()
            .Bind(configuration.GetSection(LoopRouteOptions.SectionName))
            .ValidateDataAnnotations()
            .ValidateOnStart();

        services.AddSingleton<IRouteGeometryService, RouteGeometryService>();
        services.AddScoped<ILoopRouteGenerator, LoopRouteGenerator>();

        services.AddHttpClient<IMapboxDirectionsClient, MapboxDirectionsClient>((provider, client) =>
        {
            var options = provider.GetRequiredService<
                Microsoft.Extensions.Options.IOptions<MapboxOptions>>().Value;

            client.BaseAddress = new Uri(options.BaseUrl);
            client.Timeout = TimeSpan.FromSeconds(options.TimeoutSeconds);
        });

        return services;
    }
}
