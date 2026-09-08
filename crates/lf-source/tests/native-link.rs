//! Link the public DSP API from a separate native test executable.
use lf_source::{lf_source_free, lf_source_new};

#[test]
fn native_host_can_create_and_free_state() {
    let state = lf_source_new(48_000.0);
    assert!(!state.is_null());
    lf_source_free(state);
}
