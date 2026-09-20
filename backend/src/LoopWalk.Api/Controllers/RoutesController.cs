using LoopWalk.Api.Contracts;
using LoopWalk.Core.Geometry;
using LoopWalk.Core.Routing;
using Microsoft.AspNetCore.Mvc;

namespace LoopWalk.Api.Controllers;

[ApiController]
[Route("api/routes")]
public sealed class RoutesController(ILoopRouteGenerator generator) : ControllerBase
{
    [HttpPost("generate")]
    [ProducesResponseType<GenerateRouteResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status502BadGateway)]
    public async Task<IActionResult> Generate(
        [FromBody] GenerateRouteRequest request,
        CancellationToken ct)
    {
        var start = new GeoPoint(request.StartLat, request.StartLon);

        try
        {
            var route = await generator.GenerateAsync(
                new LoopRouteRequest(start, request.DistanceMeters, request.WaypointCount, request.Seed),
                ct);

            return Ok(GenerateRouteResponse.FromRoute(route));
        }
        catch (NoRouteFoundException ex)
        {
            return Problem(
                title: "No walkable loop found",
                detail: ex.Message,
                statusCode: StatusCodes.Status502BadGateway);
        }
        catch (MapboxException ex)
        {
            return Problem(
                title: "Routing service unavailable",
                detail: ex.Message,
                statusCode: StatusCodes.Status502BadGateway);
        }
    }
}
