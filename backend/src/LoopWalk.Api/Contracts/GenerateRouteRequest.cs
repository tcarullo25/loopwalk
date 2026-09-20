using System.ComponentModel.DataAnnotations;

namespace LoopWalk.Api.Contracts;

public sealed class GenerateRouteRequest
{
    [Range(-90, 90)]
    public double StartLat { get; init; }

    [Range(-180, 180)]
    public double StartLon { get; init; }

    [Range(500, 42_000)]
    public double DistanceMeters { get; init; }

    [Range(2, 8)]
    public int WaypointCount { get; init; } = 3;

    public int? Seed { get; init; }
}
