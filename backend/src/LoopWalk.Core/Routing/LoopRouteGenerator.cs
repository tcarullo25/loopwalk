using LoopWalk.Core.Geometry;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace LoopWalk.Core.Routing;

/// <summary>
/// Ties geometry and Mapbox together, and owns the iterative radius correction: a road-snapped
/// loop is always longer than the ideal circle it was built from, so we measure and re-aim.
/// </summary>
public sealed class LoopRouteGenerator : ILoopRouteGenerator
{
    /// <summary>
    /// Bearing shift applied when an attempt finds no route at all. The golden angle avoids
    /// revisiting the same slice of the map on successive tries.
    /// </summary>
    private const double NoRouteBearingShiftDegrees = 137.5;

    private readonly IRouteGeometryService _geometry;
    private readonly IMapboxDirectionsClient _directions;
    private readonly LoopRouteOptions _options;
    private readonly ILogger<LoopRouteGenerator> _logger;

    public LoopRouteGenerator(
        IRouteGeometryService geometry,
        IMapboxDirectionsClient directions,
        IOptions<LoopRouteOptions> options,
        ILogger<LoopRouteGenerator> logger)
    {
        _geometry = geometry;
        _directions = directions;
        _options = options.Value;
        _logger = logger;
    }

    public async Task<LoopRoute> GenerateAsync(LoopRouteRequest request, CancellationToken ct = default)
    {
        ArgumentNullException.ThrowIfNull(request);
        Validate(request);

        var random = request.Seed is { } seed ? new Random(seed) : new Random();
        var bearing = random.NextDouble() * 360.0;

        // Circumference = 2*pi*r, so a loop of length D starts from this radius.
        var radius = request.TargetDistanceMeters / (2 * Math.PI);

        LoopRoute? best = null;
        var attempts = 0;

        for (var attempt = 1; attempt <= _options.MaxAttempts; attempt++)
        {
            attempts = attempt;

            var waypoints = _geometry.BuildLoopWaypoints(request.Start, radius, bearing, request.WaypointCount);
            var coordinates = BuildCoordinateSequence(request.Start, waypoints);

            var directions = await _directions.GetWalkingRouteAsync(coordinates, ct);

            if (directions is null)
            {
                _logger.LogInformation("Attempt {Attempt}: no route at bearing {Bearing:F1}°, re-aiming.", attempt, bearing);
                bearing = WrapBearing(bearing + NoRouteBearingShiftDegrees);
                continue;
            }

            var candidate = new LoopRoute(
                directions.Geometry,
                waypoints,
                request.TargetDistanceMeters,
                directions.DistanceMeters,
                directions.DurationSeconds,
                attempt);

            if (best is null || Math.Abs(candidate.DistanceErrorPercent) < Math.Abs(best.DistanceErrorPercent))
                best = candidate;

            if (Math.Abs(candidate.DistanceErrorPercent) <= _options.TolerancePercent)
            {
                _logger.LogInformation(
                    "Attempt {Attempt}: {Actual:F0}m against a {Target:F0}m target ({Error:F1}%) — within tolerance.",
                    attempt, candidate.ActualDistanceMeters, request.TargetDistanceMeters, candidate.DistanceErrorPercent);
                break;
            }

            radius = CorrectRadius(radius, request.TargetDistanceMeters, directions.DistanceMeters);
        }

        if (best is null)
            throw new NoRouteFoundException(
                $"No walkable loop was found near {request.Start.Lat:F5}, {request.Start.Lon:F5} after {attempts} attempts.");

        // Report the attempt count actually spent, not the attempt the winning candidate came from.
        return best with { AttemptCount = attempts };
    }

    /// <summary>
    /// Scales the radius toward the target, under-correcting by <see cref="LoopRouteOptions.DampingFactor"/>.
    /// The raw ratio overshoots when the road network forces long detours, so successive attempts
    /// would swing past the target instead of settling on it.
    /// </summary>
    private double CorrectRadius(double radius, double targetMeters, double actualMeters)
    {
        if (actualMeters <= 0)
            return radius;

        var ratio = targetMeters / actualMeters;
        var damped = 1.0 + _options.DampingFactor * (ratio - 1.0);

        return radius * damped;
    }

    private static IReadOnlyList<GeoPoint> BuildCoordinateSequence(GeoPoint start, IReadOnlyList<GeoPoint> waypoints)
    {
        // Closing the sequence on the start point is what makes Mapbox return a loop.
        var coordinates = new GeoPoint[waypoints.Count + 2];
        coordinates[0] = start;
        for (var i = 0; i < waypoints.Count; i++)
            coordinates[i + 1] = waypoints[i];
        coordinates[^1] = start;

        return coordinates;
    }

    private void Validate(LoopRouteRequest request)
    {
        if (double.IsNaN(request.TargetDistanceMeters) ||
            request.TargetDistanceMeters < _options.MinDistanceMeters ||
            request.TargetDistanceMeters > _options.MaxDistanceMeters)
        {
            throw new ArgumentOutOfRangeException(
                nameof(request), request.TargetDistanceMeters,
                $"Target distance must be between {_options.MinDistanceMeters} and {_options.MaxDistanceMeters} metres.");
        }

        // Geometry enforces its own waypoint bounds; Mapbox's 25-coordinate cap is the looser limit here.
        if (request.WaypointCount is < RouteGeometryService.MinWaypoints or > RouteGeometryService.MaxWaypoints)
        {
            throw new ArgumentOutOfRangeException(
                nameof(request), request.WaypointCount,
                $"Waypoint count must be between {RouteGeometryService.MinWaypoints} and {RouteGeometryService.MaxWaypoints}.");
        }
    }

    private static double WrapBearing(double degrees) => ((degrees % 360.0) + 360.0) % 360.0;
}
