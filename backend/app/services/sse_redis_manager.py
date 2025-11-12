import asyncio
import json
import logging
from typing import Dict, Set, List
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)


class RedisSSEManager:
    """
    Redis-based Server-Sent Events connection manager.

    """

    def __init__(self, redis_client):
        self.redis = redis_client
        self.local_queues: Dict[str, asyncio.Queue] = (
            {}
        )  # Still need local queues for asyncio

        # Key patterns
        self.CONNECTION_KEY = "sse:connections:{user_id}"
        self.ORG_USERS_KEY = "sse:org:{org_id}:users"
        self.METADATA_KEY = "sse:metadata:{user_id}"
        self.QUEUE_KEY = "sse:queue:{user_id}"

        # Configuration
        self.CONNECTION_TTL = 3600  # 1 hour
        self.HEARTBEAT_INTERVAL = 60  # 60 seconds
        self.QUEUE_TTL = 300  # 5 minutes for pending messages

    async def register_connection(
        self, user_id: str, org_id: int, session_token: str = None
    ) -> asyncio.Queue:
        """
        Register a new SSE connection in Redis and return a local asyncio.Queue.

        Args:
            user_id: Unique user identifier
            org_id: Organization ID for the user
            session_token: Optional session token for validation

        Returns:
            asyncio.Queue for receiving messages
        """
        try:
            queue = asyncio.Queue()
            self.local_queues[user_id] = queue

            connection_key = self.CONNECTION_KEY.format(user_id=user_id)
            connection_data = {
                "org_id": str(org_id),
                "connected_at": datetime.utcnow().isoformat(),
                "last_heartbeat": datetime.utcnow().isoformat(),
                "session_token_hash": (
                    str(hash(session_token)) if session_token else "none"
                ),
            }

            pipe = self.redis.pipeline()
            pipe.hset(connection_key, mapping=connection_data)
            pipe.expire(connection_key, self.CONNECTION_TTL)

            org_key = self.ORG_USERS_KEY.format(org_id=org_id)
            pipe.sadd(org_key, user_id)
            pipe.expire(org_key, self.CONNECTION_TTL)

            metadata_key = self.METADATA_KEY.format(user_id=user_id)
            metadata = {
                "connection_type": "sse",
                "server_instance": "fastapi_main",
                "capabilities": ["workflow_runs", "jobs"],
            }
            pipe.set(metadata_key, json.dumps(metadata), ex=self.CONNECTION_TTL)

            result = await self._execute_pipeline(pipe)
            if result is None:
                raise Exception("Pipeline execution failed")

            await self._deliver_pending_messages(user_id, queue)

            logger.info(f"Registered SSE connection for user {user_id} in org {org_id}")
            return queue

        except Exception as e:
            logger.error(f"Failed to register SSE connection for user {user_id}: {e}")
            # Fallback to local-only queue
            if user_id not in self.local_queues:
                self.local_queues[user_id] = asyncio.Queue()
            return self.local_queues[user_id]

    async def unregister_connection(self, user_id: str):
        """
        Unregister an SSE connection from Redis.

        Args:
            user_id: User identifier to unregister
        """
        try:
            connection_key = self.CONNECTION_KEY.format(user_id=user_id)
            connection_data = await self._execute_redis_cmd("hgetall", connection_key)

            if connection_data:
                org_id = connection_data.get("org_id")
                if org_id:
                    org_key = self.ORG_USERS_KEY.format(org_id=org_id)
                    await self._execute_redis_cmd("srem", org_key, user_id)

            pipe = self.redis.pipeline()
            pipe.delete(connection_key)
            pipe.delete(self.METADATA_KEY.format(user_id=user_id))
            queue_key = self.QUEUE_KEY.format(user_id=user_id)
            pipe.expire(queue_key, self.QUEUE_TTL)

            await self._execute_pipeline(pipe)

            self.local_queues.pop(user_id, None)

            logger.info(f"Unregistered SSE connection for user {user_id}")

        except Exception as e:
            logger.error(f"Failed to unregister SSE connection for user {user_id}: {e}")

    async def update_heartbeat(self, user_id: str):
        """
        Update the heartbeat timestamp for a connection.

        Args:
            user_id: User identifier
        """
        try:
            connection_key = self.CONNECTION_KEY.format(user_id=user_id)
            await self._execute_redis_cmd(
                "hset", connection_key, "last_heartbeat", datetime.utcnow().isoformat()
            )
            await self._execute_redis_cmd("expire", connection_key, self.CONNECTION_TTL)
        except Exception as e:
            logger.debug(f"Failed to update heartbeat for user {user_id}: {e}")

    async def get_org_users(self, org_id: int) -> Set[str]:
        """
        Get all users currently connected to an organization.

        Args:
            org_id: Organization ID

        Returns:
            Set of user IDs connected to the organization
        """
        try:
            org_key = self.ORG_USERS_KEY.format(org_id=org_id)
            user_ids = await self._execute_redis_cmd("smembers", org_key)

            active_users = set()
            for user_id in user_ids or []:
                if await self._is_connection_active(user_id):
                    active_users.add(user_id)
                else:
                    await self._execute_redis_cmd("srem", org_key, user_id)

            return active_users

        except Exception as e:
            logger.error(f"Failed to get org users for org {org_id}: {e}")
            return set()

    async def broadcast_to_org(self, org_id: int, event_type: str, data: dict) -> int:
        """
        Broadcast a message to all users in an organization.

        Args:
            org_id: Organization ID
            event_type: Type of event
            data: Event data

        Returns:
            Number of users the message was sent to
        """
        try:
            user_ids = await self.get_org_users(org_id)
            message = f"data: {json.dumps({'type': event_type, **data})}\n\n"

            delivered_count = 0
            failed_users = []

            for user_id in user_ids:
                if await self._send_message_to_user(user_id, message):
                    delivered_count += 1
                else:
                    failed_users.append(user_id)

            if failed_users:
                await self._cleanup_failed_connections(failed_users, org_id)

            if user_ids:
                logger.info(
                    f"Broadcasted {event_type} to {delivered_count}/{len(user_ids)} users in org {org_id}"
                )

            return delivered_count

        except Exception as e:
            logger.error(f"Failed to broadcast to org {org_id}: {e}")
            return 0

    async def get_connection_stats(self) -> dict:
        """
        Get statistics about SSE connections.

        Returns:
            Dictionary with connection statistics
        """
        try:
            connection_pattern = self.CONNECTION_KEY.format(user_id="*")
            connection_keys = await self._execute_redis_cmd("keys", connection_pattern)
            total_connections = len(connection_keys or [])

            org_pattern = self.ORG_USERS_KEY.format(org_id="*")
            org_keys = await self._execute_redis_cmd("keys", org_pattern)
            org_stats = {}

            for org_key in org_keys or []:
                org_id = org_key.split(":")[2]
                user_count = await self._execute_redis_cmd("scard", org_key)
                org_stats[org_id] = user_count

            return {
                "total_connections": total_connections,
                "local_queues": len(self.local_queues),
                "organizations": org_stats,
                "redis_connected": await self._test_redis_connection(),
            }

        except Exception as e:
            logger.error(f"Failed to get connection stats: {e}")
            return {
                "total_connections": 0,
                "local_queues": len(self.local_queues),
                "organizations": {},
                "redis_connected": False,
                "error": str(e),
            }

    # Private helper methods

    async def _is_connection_active(self, user_id: str) -> bool:
        """Check if a connection is still active based on heartbeat."""
        try:
            connection_key = self.CONNECTION_KEY.format(user_id=user_id)
            last_heartbeat = await self._execute_redis_cmd(
                "hget", connection_key, "last_heartbeat"
            )

            if not last_heartbeat:
                return False

            last_time = datetime.fromisoformat(last_heartbeat)
            cutoff_time = datetime.utcnow() - timedelta(
                seconds=self.HEARTBEAT_INTERVAL * 2
            )  # 2x grace period

            return last_time > cutoff_time

        except Exception as e:
            logger.debug(f"Error checking connection active for user {user_id}: {e}")
            return False

    async def _send_message_to_user(self, user_id: str, message: str) -> bool:
        """
        Send a message to a specific user.

        Args:
            user_id: User to send message to
            message: SSE formatted message

        Returns:
            True if message was delivered, False otherwise
        """
        try:
            if user_id in self.local_queues:
                queue = self.local_queues[user_id]
                await queue.put(message)
                return True

            queue_key = self.QUEUE_KEY.format(user_id=user_id)
            await self._execute_redis_cmd("lpush", queue_key, message)
            await self._execute_redis_cmd("expire", queue_key, self.QUEUE_TTL)
            await self._execute_redis_cmd("ltrim", queue_key, 0, 99)

            logger.debug(f"Queued message for offline user {user_id}")
            return True

        except Exception as e:
            logger.warning(f"Failed to send message to user {user_id}: {e}")
            return False

    async def _deliver_pending_messages(self, user_id: str, queue: asyncio.Queue):
        """Deliver any pending messages to a newly connected user."""
        try:
            queue_key = self.QUEUE_KEY.format(user_id=user_id)

            messages = await self._execute_redis_cmd("lrange", queue_key, 0, -1)
            if messages:
                for message in reversed(messages):
                    await queue.put(message)

                await self._execute_redis_cmd("delete", queue_key)
                logger.info(
                    f"Delivered {len(messages)} pending messages to user {user_id}"
                )

        except Exception as e:
            logger.debug(f"Failed to deliver pending messages to user {user_id}: {e}")

    async def _cleanup_failed_connections(self, user_ids: List[str], org_id: int):
        """Clean up connections that failed to receive messages."""
        try:
            org_key = self.ORG_USERS_KEY.format(org_id=org_id)
            for user_id in user_ids:
                await self.unregister_connection(user_id)
                logger.debug(f"Cleaned up failed connection for user {user_id}")
        except Exception as e:
            logger.debug(f"Failed to cleanup failed connections: {e}")

    async def _execute_redis_cmd(self, command: str, *args, **kwargs):
        """Execute a Redis command with error handling."""
        try:
            cmd = getattr(self.redis, command)
            if asyncio.iscoroutinefunction(cmd):
                return await cmd(*args, **kwargs)
            else:
                return cmd(*args, **kwargs)
        except Exception as e:
            logger.error(f"Redis command '{command}' failed: {e}")
            return None

    async def _execute_pipeline(self, pipe):
        """Execute a Redis pipeline with error handling."""
        try:
            if asyncio.iscoroutinefunction(pipe.execute):
                result = await pipe.execute()
            else:
                result = pipe.execute()
            return result
        except Exception as e:
            logger.error(f"Redis pipeline execution failed: {e}")
            return None

    async def _test_redis_connection(self) -> bool:
        """Test if Redis connection is working."""
        try:
            result = await self._execute_redis_cmd("ping")
            return result or result == b"PONG" or result == "PONG"
        except Exception as e:
            logger.error(e)
            return False
