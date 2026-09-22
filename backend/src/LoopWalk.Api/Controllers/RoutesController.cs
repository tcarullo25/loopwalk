using LoopWalk.Api.Contracts;
using LoopWalk.Core.Geometry;
using LoopWalk.Core.Routing;
using Microsoft.AspNetCore.Mvc;

namespace LoopWalk.Api.Controllers;

[ApiController]
[Route("api/routes")]
public sealed class RoutesController : ControllerBase
{
    private readonly ILoopRouteGenerator _generator;

    public RoutesController(ILoopRouteGenerator generator)
    {
        _generator = generator;
    }

    [HttpPost("generate")]
    public async Task<ActionResult<GenerateRouteResponse>> Generate(
        GenerateRouteRequest request, CancellationToken ct)
    {
        var coreRequest = new LoopRouteRequest(
            GeoPoint.Create(request.StartLat, request.StartLon),
            request.DistanceMeters,
            request.WaypointCount ?? 3,
            request.Seed);

        try
        {
            var route = await _generator.GenerateAsync(coreRequest, ct);
            return Ok(ToResponse(route));
        }
        catch (NoRouteFoundException ex)
        {
            return Problem(detail: ex.Message, statusCode: StatusCodes.Status502BadGateway);
        }
        catch (MapboxException ex)
        {
            return Problem(detail: ex.Message, statusCode: StatusCodes.Status502BadGateway);
        }
    }

    private static GenerateRouteResponse ToResponse(LoopRoute route) => new(
        new GeoJsonLineStringFeature(
            new GeoJsonLineStringGeometry(route.Geometry.Select(p => p.ToGeoJsonPosition()).ToArray())),
        route.RequestedDistanceMeters,
        route.ActualDistanceMeters,
        route.DistanceErrorPercent,
        route.EstimatedDurationSeconds,
        route.AttemptCount,
        route.Waypoints.Select(w => new WaypointDto(w.Lat, w.Lon)).ToArray());
}
