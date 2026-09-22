namespace LoopWalk.Api.Contracts;

public sealed record GenerateRouteResponse(
    GeoJsonLineStringFeature GeoJson,
    double RequestedDistanceMeters,
    double ActualDistanceMeters,
    double DistanceErrorPercent,
    double EstimatedDurationSeconds,
    int AttemptCount,
    IReadOnlyList<WaypointDto> Waypoints);

public sealed record WaypointDto(double Lat, double Lon);

public sealed record GeoJsonLineStringFeature(GeoJsonLineStringGeometry Geometry)
{
    public string Type { get; init; } = "Feature";
    public object Properties { get; init; } = new { };
}

public sealed record GeoJsonLineStringGeometry(IReadOnlyList<double[]> Coordinates)
{
    public string Type { get; init; } = "LineString";
}
