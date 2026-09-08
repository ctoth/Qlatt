//! Link the public DSP API from a separate native test executable.
use antiresonator::{antiresonator_free, antiresonator_new};

#[test]
fn native_host_can_create_and_free_state() {
    let state = antiresonator_new();
    assert!(!state.is_null());
    antiresonator_free(state);
}
