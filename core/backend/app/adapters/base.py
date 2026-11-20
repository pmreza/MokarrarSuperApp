import logging
import asyncio
from typing import Any
import httpx

logger = logging.getLogger("mokarrar.adapters")


class AdapterError(Exception):
    """Base exception for all external service adapters."""
    def __init__(self, message: str, status_code: int | None = None, details: Any = None):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.details = details


class AdapterTimeoutError(AdapterError):
    """Raised when an external service times out."""
    pass


class AdapterAuthError(AdapterError):
    """Raised on 401 or 403 authentication failures."""
    pass


class AdapterNotFoundError(AdapterError):
    """Raised on 404 resource not found."""
    pass


class BaseHTTPAdapter:
    """
    Robust asynchronous HTTP client wrapper with retries, timeouts,
    structured logging, and clean domain exception mapping.
    """

    def __init__(
        self,
        base_url: str,
        service_name: str,
        timeout: float = 12.0,
        max_retries: int = 3,
        default_headers: dict[str, str] | None = None,
    ):
        self.base_url = base_url.rstrip("/")
        self.service_name = service_name
        self.timeout = timeout
        self.max_retries = max_retries
        self.default_headers = default_headers or {}

    def _get_client(self) -> httpx.AsyncClient:
        return httpx.AsyncClient(
            base_url=self.base_url,
            timeout=self.timeout,
            headers=self.default_headers,
        )

    async def request(
        self,
        method: str,
        endpoint: str,
        params: dict[str, Any] | None = None,
        json_data: Any = None,
        headers: dict[str, str] | None = None,
    ) -> Any:
        url = f"{self.base_url}/{endpoint.lstrip('/')}"
        merged_headers = {**self.default_headers, **(headers or {})}

        attempt = 0
        last_exception: Exception | None = None

        while attempt < self.max_retries:
            attempt += 1
            try:
                logger.info(
                    "[%s] Request attempt %d/%d: %s %s",
                    self.service_name,
                    attempt,
                    self.max_retries,
                    method.upper(),
                    endpoint,
                )

                async with httpx.AsyncClient(timeout=self.timeout) as client:
                    response = await client.request(
                        method=method,
                        url=url,
                        params=params,
                        json=json_data,
                        headers=merged_headers,
                    )

                if response.status_code in (401, 403):
                    raise AdapterAuthError(
                        f"Authentication failed for {self.service_name}: {response.text}",
                        status_code=response.status_code,
                    )
                if response.status_code == 404:
                    raise AdapterNotFoundError(
                        f"Resource not found in {self.service_name}: {endpoint}",
                        status_code=404,
                    )

                if response.is_server_error and attempt < self.max_retries:
                    logger.warning(
                        "[%s] Server error %d on %s, retrying...",
                        self.service_name,
                        response.status_code,
                        endpoint,
                    )
                    await asyncio.sleep(0.5 * (2 ** (attempt - 1)))
                    continue

                response.raise_for_status()

                if response.content:
                    try:
                        return response.json()
                    except ValueError:
                        return response.text
                return None

            except (httpx.TimeoutException, TimeoutError) as e:
                last_exception = AdapterTimeoutError(
                    f"Timeout connecting to {self.service_name} after {self.timeout}s: {e}"
                )
                logger.warning("[%s] Timeout on attempt %d: %s", self.service_name, attempt, e)
                if attempt < self.max_retries:
                    await asyncio.sleep(0.5 * (2 ** (attempt - 1)))
                    continue
            except (httpx.ConnectError, httpx.NetworkError) as e:
                last_exception = AdapterError(
                    f"Network connection failed for {self.service_name}: {e}"
                )
                logger.warning("[%s] Network error on attempt %d: %s", self.service_name, attempt, e)
                if attempt < self.max_retries:
                    await asyncio.sleep(0.5 * (2 ** (attempt - 1)))
                    continue
            except AdapterError:
                raise
            except Exception as e:
                logger.error("[%s] Unexpected exception: %s", self.service_name, e)
                raise AdapterError(f"Unexpected error in {self.service_name}: {e}") from e

        if last_exception:
            raise last_exception
        raise AdapterError(f"Request failed to {self.service_name} after {self.max_retries} attempts")
