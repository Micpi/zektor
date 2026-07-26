"""Tests for NAD AVR entity filtering helpers."""

from custom_components.nad_avr.const import CORE_VARIABLES
from custom_components.nad_avr.coordinator import _core_query_variables
from custom_components.nad_avr.model_profiles import (
    model_query_variables,
    normalize_model,
    profile_for_model,
)
from custom_components.nad_avr.select import _listening_mode_options


def test_listening_mode_options_are_narrowed_by_supported_signal_families() -> None:
    """Only options from supported signal-family variables should be exposed."""
    options = _listening_mode_options(
        {
            "Main.ListeningMode",
            "Main.ListeningMode.DTS",
        }
    )

    assert options == ["NEO6Music", "None", "StereoDownmix"]


def test_listening_mode_options_fall_back_to_active_mode_values() -> None:
    """If no signal-family variable answered, keep the active mode command values."""
    options = _listening_mode_options({"Main.ListeningMode"})

    assert "EnhancedStereo" in options
    assert "PLIIMovie" in options


def test_core_variables_include_main_listening_mode() -> None:
    """The default entity set should include the active listening mode variable."""
    assert "Main.ListeningMode" in CORE_VARIABLES


def test_core_query_variables_include_supported_core_controls() -> None:
    """The normal polling profile should probe every queryable core variable."""
    variables = _core_query_variables()

    assert "Main.Model" in variables
    assert "Main.ListeningMode" in variables
    assert "Zone2.Power" in variables


def test_t758_aliases_normalize_to_t758_profile() -> None:
    """T758 variants should use the T758 capability profile."""
    assert normalize_model("T758 V3i") == "T758"
    assert profile_for_model("T758V3").model == "T758"


def test_t758_profile_limits_extra_zones() -> None:
    """The T758 profile should avoid probing zones not listed in the manual profile."""
    variables = model_query_variables("T758", query_all=False)

    assert "Zone2.Power" in variables
    assert "Zone3.Power" not in variables
    assert "Zone4.Power" not in variables


def test_query_all_bypasses_model_profile_for_discovery() -> None:
    """Full discovery should still probe every known queryable variable."""
    variables = model_query_variables("T758", query_all=True)

    assert "Zone3.Power" in variables
    assert "Zone4.Power" in variables


def test_model_profile_probes_listening_mode_families() -> None:
    """Normal probing should include signal-family listening mode variables."""
    variables = model_query_variables("T758", query_all=False)

    assert "Main.ListeningMode" in variables
    assert "Main.ListeningMode.DTS" in variables
    assert "Main.ListeningMode.DolbyDigital" in variables
