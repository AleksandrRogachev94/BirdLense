import asyncio
import os

import httpx
import yaml

from fastmcp import FastMCP
from fastmcp.server.openapi import RouteMap, RouteType

# Load OpenAPI spec from YAML file
OPENAPI_PATH = os.path.join(os.path.dirname(__file__), "openapi.yaml")
with open(OPENAPI_PATH, "r") as f:
    birdlense_spec = yaml.safe_load(f)

# Patch OpenAPI spec to make all endpoints tools (x-tool: true)
for path, methods in birdlense_spec.get("paths", {}).items():
    for method, op in methods.items():
        if isinstance(op, dict):
            op["x-tool"] = True

custom_maps = [
    RouteMap(
        methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"],
        pattern=r".*",
        route_type=RouteType.TOOL,
    )
]


async def check_mcp(mcp: FastMCP):
    # List what components were created
    tools = await mcp.get_tools()
    resources = await mcp.get_resources()
    templates = await mcp.get_resource_templates()

    print(
        f"{len(tools)} Tool(s): {', '.join([t.name for t in tools.values()])}"
    )  # Should include createPet
    print(
        f"{len(resources)} Resource(s): {', '.join([r.name for r in resources.values()])}"
    )  # Should include listPets
    print(
        f"{len(templates)} Resource Template(s): {', '.join([t.name for t in templates.values()])}"
    )  # Should include getPet

    return mcp


if __name__ == "__main__":
    # Client for the BirdLense API
    client = httpx.AsyncClient(base_url="http://birdlense.local/api/ui")

    # Create the MCP server with custom route maps
    mcp = FastMCP.from_openapi(
        openapi_spec=birdlense_spec,
        client=client,
        name="BirdLense",
        route_maps=custom_maps,
    )

    asyncio.run(check_mcp(mcp))

    # Start the MCP server
    mcp.run()
