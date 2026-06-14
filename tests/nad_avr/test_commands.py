"""Tests for NAD AVR command metadata."""

from custom_components.nad_avr.commands import (
    COMMANDS,
    QUERYABLE_VARIABLES,
    SETTABLE_VARIABLES,
)


def test_generated_command_table_contains_full_vendor_surface() -> None:
    """Verify the generated command table matches the bundled NAD PDFs."""
    assert len(COMMANDS) == 276
    assert len(QUERYABLE_VARIABLES) == 272
    assert len(SETTABLE_VARIABLES) == 261


def test_core_avr_variables_have_expected_metadata() -> None:
    """Verify key AVR variables are represented with useful metadata."""
    assert COMMANDS["Main.Power"]["values"] in (["Off", "On"], ["On", "Off"])
    assert COMMANDS["Main.Volume"]["range"] == [-99, 19]
    assert COMMANDS["Main.Source"]["range"] == [1, 10]
    assert COMMANDS["Zone2.Power"]["values"] in (["Off", "On"], ["On", "Off"])

