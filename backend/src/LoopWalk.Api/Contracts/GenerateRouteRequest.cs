using System.ComponentModel.DataAnnotations;

namespace LoopWalk.Api.Contracts;

/// <param name="Seed">Optional. The same seed and inputs reproduce the same route.</param>
public sealed record GenerateRouteRequest(
    [property: Range(-90, 90)] double StartLat,
    [property: Range(-180, 180)] double StartLon,
    [property: Range(500, 42_000)] double DistanceMeters,
    [property: Range(2, 8)] int WaypointCount = 3,
    int? Seed = null);
