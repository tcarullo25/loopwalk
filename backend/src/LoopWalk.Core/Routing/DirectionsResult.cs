using LoopWalk.Core.Geometry;

namespace LoopWalk.Core.Routing;

/// <summary>A road-snapped route returned by the Directions API.</summary>
public sealed record DirectionsResult(
    double DistanceMeters,
    double DurationSeconds,
    IReadOnlyList<GeoPoint> Geometry);
