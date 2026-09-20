using LoopWalk.Core.Geometry;
using LoopWalk.Core.Routing;

namespace LoopWalk.Api.Contracts;

/// <summary>A named lat/lon pair. Everything outside <c>geoJson</c> uses these names, not positional arrays.</summary>
public sealed record WaypointDto(double Lat, double Lon);

public sealed record GenerateRouteResponse(
    object GeoJson,
    double RequestedDistanceMeters,
    double ActualDistanceMeters,
    double DistanceErrorPercent,
    double EstimatedDurationSeconds,
    int AttemptCount,
    IReadOnlyList<WaypointDto> Waypoints)
{
    public static GenerateRouteResponse FromRoute(LoopRoute route) => new(
        GeoJson: BuildFeature(route.Geometry),
        RequestedDistanceMeters: route.RequestedDistanceMeters,
        ActualDistanceMeters: route.ActualDistanceMeters,
        DistanceErrorPercent: route.DistanceErrorPercent,
        EstimatedDurationSeconds: route.EstimatedDurationSeconds,
        AttemptCount: route.AttemptCount,
        Waypoints: [.. route.Waypoints.Select(w => new WaypointDto(w.Lat, w.Lon))]);

    /// <summary>Coordinates inside GeoJSON are [lon, lat] — the reverse of the named fields above.</summary>
    private static object BuildFeature(IReadOnlyList<GeoPoint> geometry) => new
    {
        type = "Feature",
        geometry = new
        {
            type = "LineString",
            coordinates = geometry.Select(p => p.ToGeoJsonPosition()).ToArray(),
        },
        properties = new { },
    };
}
