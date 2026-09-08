//! Link the public DSP API from a separate native test executable.
use resonator::{resonator_free, resonator_new};

#[test]
fn native_host_can_create_and_free_state() {
    let state = resonator_new();
    assert!(!state.is_null());
    resonator_free(state);
}
