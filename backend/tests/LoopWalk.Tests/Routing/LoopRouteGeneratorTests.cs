using LoopWalk.Core.Geometry;
using LoopWalk.Core.Routing;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

namespace LoopWalk.Tests.Routing;

public class LoopRouteGeneratorTests
{
    private static readonly GeoPoint Start = new(40.7128, -74.0060);

    private static LoopRouteGenerator CreateSut(
        IMapboxDirectionsClient client,
        LoopRouteOptions? options = null)
        => new(
            new RouteGeometryService(),
            client,
            Options.Create(options ?? new LoopRouteOptions()),
            NullLogger<LoopRouteGenerator>.Instance);

    private static LoopRouteRequest Request(double distanceMeters = 5_000, int waypoints = 3, int? seed = 42)
        => new(Start, distanceMeters, waypoints, seed);

    [Fact]
    public async Task GenerateAsync_ClosesTheLoopOnTheStartPoint()
    {
        var client = FakeDirectionsClient.WithConstantInflation(1.0);

        await CreateSut(client).GenerateAsync(Request());

        var coordinates = client.Requests[0];
        Assert.Equal(Start, coordinates[0]);
        Assert.Equal(Start, coordinates[^1]);
    }

    [Fact]
    public async Task GenerateAsync_SendsStartPlusWaypointsPlusReturn()
    {
        var client = FakeDirectionsClient.WithConstantInflation(1.0);

        await CreateSut(client).GenerateAsync(Request(waypoints: 4));

        Assert.Equal(6, client.Requests[0].Count);
    }

    [Fact]
    public async Task GenerateAsync_WithinToleranceOnFirstTry_DoesNotRetry()
    {
        // A polygon inscribed in the circle is shorter than the circle itself, and mild road
        // inflation brings it back near the target, so attempt one is already good enough.
        var client = FakeDirectionsClient.WithConstantInflation(1.15);

        var route = await CreateSut(client).GenerateAsync(Request());

        Assert.Equal(1, client.CallCount);
        Assert.Equal(1, route.AttemptCount);
        Assert.InRange(Math.Abs(route.DistanceErrorPercent), 0, 10);
    }

    [Fact]
    public async Task GenerateAsync_WhenRouteRunsLong_ShrinksTheRadiusAndConverges()
    {
        var client = FakeDirectionsClient.WithConstantInflation(1.8);
        var options = new LoopRouteOptions { MaxAttempts = 5, TolerancePercent = 10 };

        var route = await CreateSut(client, options).GenerateAsync(Request());

        Assert.True(client.CallCount > 1, "An overlong route should have triggered a correction.");
        Assert.InRange(Math.Abs(route.DistanceErrorPercent), 0, 10);
    }

    [Fact]
    public async Task GenerateAsync_CorrectionShrinksTheLoopMonotonically()
    {
        var client = FakeDirectionsClient.WithConstantInflation(2.0);
        var options = new LoopRouteOptions { MaxAttempts = 3, TolerancePercent = 1 };
        var geometry = new RouteGeometryService();

        await CreateSut(client, options).GenerateAsync(Request());

        // Each retry should pull the waypoints closer to the start, never push them further out.
        var spans = client.Requests
            .Select(r => geometry.DistanceMeters(r[0], r[r.Count / 2]))
            .ToList();

        Assert.Equal(3, spans.Count);
        Assert.True(spans[1] < spans[0], "Second attempt should be tighter than the first.");
        Assert.True(spans[2] < spans[1], "Third attempt should be tighter than the second.");
    }

    [Fact]
    public async Task GenerateAsync_DampingPreventsCollapse()
    {
        // Correcting a 2x-inflated route by the raw ratio would halve the radius and send the next
        // attempt far under the target. Damping should keep the corrected loop from collapsing.
        var client = FakeDirectionsClient.WithConstantInflation(2.0);
        var options = new LoopRouteOptions { MaxAttempts = 2, TolerancePercent = 1, DampingFactor = 0.7 };

        var route = await CreateSut(client, options).GenerateAsync(Request());

        Assert.True(route.DistanceErrorPercent > -100, "The corrected route should not collapse.");
    }

    [Fact]
    public async Task GenerateAsync_ExhaustsAttempts_ReturnsClosestAttempt()
    {
        // Wildly inflated: never within tolerance, so every attempt gets spent.
        var client = FakeDirectionsClient.WithConstantInflation(4.0);
        var options = new LoopRouteOptions { MaxAttempts = 3, TolerancePercent = 1 };

        var route = await CreateSut(client, options).GenerateAsync(Request());

        Assert.Equal(3, client.CallCount);
        Assert.Equal(3, route.AttemptCount);
        Assert.True(route.ActualDistanceMeters > 0);
    }

    [Fact]
    public async Task GenerateAsync_NoRouteOnFirstAttempt_ReAimsAndSucceeds()
    {
        var client = new FakeDirectionsClient(attempt => attempt == 1 ? null : 1.15);

        var route = await CreateSut(client).GenerateAsync(Request());

        Assert.Equal(2, client.CallCount);

        // The retry should aim the loop somewhere new rather than repeat the failed request.
        Assert.NotEqual(client.Requests[0][1], client.Requests[1][1]);
        Assert.True(route.ActualDistanceMeters > 0);
    }

    [Fact]
    public async Task GenerateAsync_NoRouteEverFound_Throws()
    {
        var client = new FakeDirectionsClient(_ => null);

        await Assert.ThrowsAsync<NoRouteFoundException>(
            () => CreateSut(client).GenerateAsync(Request()));
    }

    [Fact]
    public async Task GenerateAsync_SameSeed_ProducesTheSameRoute()
    {
        var first = FakeDirectionsClient.WithConstantInflation(1.15);
        var second = FakeDirectionsClient.WithConstantInflation(1.15);

        var a = await CreateSut(first).GenerateAsync(Request(seed: 99));
        var b = await CreateSut(second).GenerateAsync(Request(seed: 99));

        Assert.Equal(a.Waypoints, b.Waypoints);
        Assert.Equal(a.ActualDistanceMeters, b.ActualDistanceMeters, 0.001);
    }

    [Fact]
    public async Task GenerateAsync_DifferentSeeds_ProduceDifferentRoutes()
    {
        var first = FakeDirectionsClient.WithConstantInflation(1.15);
        var second = FakeDirectionsClient.WithConstantInflation(1.15);

        var a = await CreateSut(first).GenerateAsync(Request(seed: 1));
        var b = await CreateSut(second).GenerateAsync(Request(seed: 2));

        Assert.NotEqual(a.Waypoints, b.Waypoints);
    }

    [Theory]
    [InlineData(100)]
    [InlineData(50_000)]
    [InlineData(double.NaN)]
    public async Task GenerateAsync_DistanceOutOfRange_Throws(double distance)
    {
        var client = FakeDirectionsClient.WithConstantInflation(1.0);

        await Assert.ThrowsAsync<ArgumentOutOfRangeException>(
            () => CreateSut(client).GenerateAsync(Request(distance)));
    }

    [Theory]
    [InlineData(1)]
    [InlineData(9)]
    public async Task GenerateAsync_WaypointCountOutOfRange_Throws(int waypoints)
    {
        var client = FakeDirectionsClient.WithConstantInflation(1.0);

        await Assert.ThrowsAsync<ArgumentOutOfRangeException>(
            () => CreateSut(client).GenerateAsync(Request(waypoints: waypoints)));
    }

    [Fact]
    public async Task GenerateAsync_ReportsDurationAndGeometry()
    {
        var client = FakeDirectionsClient.WithConstantInflation(1.15);

        var route = await CreateSut(client).GenerateAsync(Request());

        Assert.True(route.EstimatedDurationSeconds > 0);
        Assert.NotEmpty(route.Geometry);
        Assert.Equal(5_000, route.RequestedDistanceMeters);
    }
}
