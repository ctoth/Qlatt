//! Link the public DSP API from a separate native test executable.
use decay_envelope::{decay_envelope_free, decay_envelope_new};

#[test]
fn native_host_can_create_and_free_state() {
    let state = decay_envelope_new(48_000.0);
    assert!(!state.is_null());
    decay_envelope_free(state);
}
