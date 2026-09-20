using LoopWalk.Core.Geometry;

namespace LoopWalk.Core.Routing;

/// <param name="Seed">Optional. The same seed and inputs reproduce the same route.</param>
public sealed record LoopRouteRequest(
    GeoPoint Start,
    double TargetDistanceMeters,
    int WaypointCount = 3,
    int? Seed = null);

public sealed record LoopRoute(
    IReadOnlyList<GeoPoint> Geometry,
    IReadOnlyList<GeoPoint> Waypoints,
    double RequestedDistanceMeters,
    double ActualDistanceMeters,
    double EstimatedDurationSeconds,
    int AttemptCount)
{
    /// <summary>Signed error: positive when the snapped route came out longer than asked for.</summary>
    public double DistanceErrorPercent =>
        RequestedDistanceMeters <= 0
            ? 0
            : (ActualDistanceMeters - RequestedDistanceMeters) / RequestedDistanceMeters * 100.0;
}

/// <summary>No walkable loop exists near the start point. Surfaces as a 502 rather than a 500.</summary>
public sealed class NoRouteFoundException : Exception
{
    public NoRouteFoundException(string message) : base(message) { }
}
