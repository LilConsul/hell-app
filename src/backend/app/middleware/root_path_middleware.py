class RootPathMiddleware:
    """
    Middleware that handles multiple root paths for the application.
    This allows the same API to be accessed from different root paths.
    """
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        from ..settings import settings

        path = scope["path"]
        original_path = path

        # First check if the path is under any of our root paths
        current_root_path = None
        for root_path in settings.ROOT_PATHS:
            if path.startswith(root_path):
                # Strip the root path for correct routing
                path = path[len(root_path):]
                if not path:
                    path = "/"
                current_root_path = root_path
                break

        # Update the path and root_path in scope
        if current_root_path:
            scope["path"] = path
            scope["root_path"] = current_root_path

            # Special handling for OpenAPI documentation paths
            if path in ["/docs", "/redoc", "/openapi.json"]:
                # For documentation endpoints, we need to set the correct server URL
                # This ensures the OpenAPI schema has correct paths
                scope["swagger_ui_init_oauth"] = {}

                # Make sure we have correct base URL for the docs
                if "swagger_ui_oauth2_redirect_url" not in scope:
                    scope["swagger_ui_oauth2_redirect_url"] = f"{current_root_path}/docs/oauth2-redirect"

        await self.app(scope, receive, send)
