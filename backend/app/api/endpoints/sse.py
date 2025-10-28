import asyncio
import json
import logging
import time
from typing import Dict

import redis


from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse

from app.api.dependencies import get_current_user
from app.schemas.user import User
from app.services.sse_redis_manager import RedisSSEManager
from app.core.config import settings


router = APIRouter()
logger = logging.getLogger(__name__)


# TODO: Look into the issue with redis not clearing out old connections (Might be a fast reload issue?)
# TODO: Remove dict fallback eventually
# TODO: Weird caching issue that seems to happen when the client disconnects and reconnects

try:
    redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)
    redis_client.ping()
    sse_manager = RedisSSEManager(redis_client)
    logger.info(f"SSE using Redis at {settings.REDIS_URL}")
except Exception as e:
    sse_manager = None
    logger.warning(f"SSE falling back to memory-based connections: {e}")
    connections: Dict[str, asyncio.Queue] = {}
    user_orgs: Dict[str, int] = {}


@router.get("/events")
async def stream_events(
    user: User = Depends(get_current_user),
):
    """
    Establishes a Server-Sent Events (SSE) connection for real-time workflow run updates.

    This endpoint creates a persistent connection for the authenticated user, allowing the server
    to push events to the client as they occur. Each user is assigned a unique asyncio.Queue to
    receive events. Heartbeat messages are sent every 30 seconds to keep the connection alive.

    Args:
        user (User): The currently authenticated user, injected via FastAPI dependency.

    Yields:
        str: SSE-formatted event data.

    Returns:
        StreamingResponse: A streaming HTTP response with media type 'text/event-stream'.
    """
    user_id = str(user["id"])
    org_id = user["organization_id"]

    logger.info(f"SSE connection request from user {user_id}, org {org_id}")

    if sse_manager:
        try:
            queue = await sse_manager.register_connection(user_id, org_id)
            logger.info(f"Redis SSE: Registered user {user_id} for org {org_id}")
        except Exception as e:
            logger.error(
                f"Redis SSE: Failed to register user {user_id} for org {org_id}: {e}"
            )
            queue = asyncio.Queue()
            connections[user_id] = queue
            user_orgs[user_id] = org_id
            logger.info(
                f"Memory SSE: Fallback registered user {user_id} for org {org_id}"
            )
    else:
        queue = asyncio.Queue()
        connections[user_id] = queue
        user_orgs[user_id] = org_id
        logger.info(f"Memory SSE: Registered user {user_id} for org {org_id}")
        logger.info(
            f"Memory SSE: Total connections: {len(connections)}, Total users: {len(user_orgs)}"
        )

    async def event_stream():
        try:
            yield f"data: {json.dumps({'type': 'connected', 'org_id': org_id})}\n\n"

            while True:
                try:
                    message = await asyncio.wait_for(queue.get(), timeout=30.0)
                    yield message
                except asyncio.TimeoutError:
                    if sse_manager:
                        await sse_manager.update_heartbeat(user_id)
                    yield f"data: {json.dumps({'type': 'heartbeat', 'timestamp': time.time()})}\n\n"
                except Exception as e:
                    logger.error(f"SSE stream error for user {user_id}: {e}")
                    break

        except Exception as e:
            logger.error(f"SSE event_stream error: {e}")
        finally:
            if sse_manager:
                await sse_manager.unregister_connection(user_id)
            else:
                connections.pop(user_id, None)
                user_orgs.pop(user_id, None)
            logger.info(f"Cleaned up SSE connection for user {user_id}")

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


async def broadcast_event(org_id: int, event_type: str, data: dict):
    """
    Broadcasts an event to all connected users in a specific organization.

    Args:
        org_id (int): The organization ID to broadcast the event to.
        event_type (str): The type of event being broadcast (e.g., 'workflow_update').
        data (dict): The event payload to send to clients.

    Returns:
        None
    """
    if sse_manager:
        delivered_count = await sse_manager.broadcast_to_org(org_id, event_type, data)
        if delivered_count > 0:
            logger.info(
                f"Redis SSE: Broadcasted {event_type} to {delivered_count} users in org {org_id}"
            )
        else:
            logger.warning(
                f"Redis SSE: No users connected to receive {event_type} for org {org_id}"
            )
    else:
        message = f"data: {json.dumps({'type': event_type, **data})}\n\n"

        users_to_notify = [
            user_id
            for user_id, user_org_id in user_orgs.items()
            if user_org_id == org_id and user_id in connections
        ]

        for user_id in users_to_notify:
            try:
                queue = connections[user_id]
                await queue.put(message)
            except Exception as e:
                logger.warning(f"Failed to send SSE message to user {user_id}: {e}")
                connections.pop(user_id, None)
                user_orgs.pop(user_id, None)

        if users_to_notify:
            logger.info(
                f"Memory SSE: Broadcasted {event_type} to {len(users_to_notify)} users in org {org_id}"
            )
        else:
            logger.warning(
                f"Memory SSE: No users connected to receive {event_type} for org {org_id}"
            )
