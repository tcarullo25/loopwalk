using System.ComponentModel.DataAnnotations;

namespace LoopWalk.Api.Contracts;

public sealed record GenerateRouteRequest(
    [Range(-90, 90)] double StartLat,
    [Range(-180, 180)] double StartLon,
    [Range(500, 42_000)] double DistanceMeters,
    [Range(2, 8)] int? WaypointCount,
    int? Seed);
