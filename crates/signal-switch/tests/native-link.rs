//! Link the public DSP API from a separate native test executable.
use signal_switch::{signal_switch_free, signal_switch_new};

#[test]
fn native_host_can_create_and_free_state() {
    let state = signal_switch_new();
    assert!(!state.is_null());
    signal_switch_free(state);
}
