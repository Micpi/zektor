"""Tests for the NAD AVR protocol client."""

from custom_components.nad_avr.api import NadClient
from custom_components.nad_avr.const import CONNECTION_TELNET


class FakeFuture:
    """Small future-like object for synchronous parser tests."""

    def __init__(self) -> None:
        self._done = False
        self._result: str | None = None

    def done(self) -> bool:
        """Return whether the future was completed."""
        return self._done

    def set_result(self, value: str) -> None:
        """Store the result."""
        self._done = True
        self._result = value

    def result(self) -> str | None:
        """Return the stored result."""
        return self._result


def test_handle_line_updates_state_and_resolves_pending_future() -> None:
    """A response line should update cache and complete matching queries."""
    client = NadClient(CONNECTION_TELNET, host="127.0.0.1")
    future = FakeFuture()
    client._pending["Main.Model"].append(future)  # pylint: disable=protected-access

    client._handle_line("Main.Model=T787")  # pylint: disable=protected-access

    assert client.state["Main.Model"] == "T787"
    assert future.result() == "T787"


def test_handle_line_ignores_non_assignment_data() -> None:
    """Noise or echoed data without equals should be ignored."""
    client = NadClient(CONNECTION_TELNET, host="127.0.0.1")

    client._handle_line("Main.Volume?")  # pylint: disable=protected-access

    assert client.state == {}

