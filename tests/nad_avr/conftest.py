"""Pytest fixtures for NAD AVR tests."""

from __future__ import annotations

import asyncio

import pytest


@pytest.fixture
def event_loop_policy(socket_enabled: None):
    """Allow pytest-asyncio to create its Windows event loop."""
    _ = socket_enabled
    if hasattr(asyncio, "WindowsProactorEventLoopPolicy"):
        return asyncio.WindowsProactorEventLoopPolicy()
    return asyncio.DefaultEventLoopPolicy()

