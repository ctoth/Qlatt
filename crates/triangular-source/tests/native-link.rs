//! Link the public DSP API from a separate native test executable.
use triangular_source::{triangular_source_free, triangular_source_new};

#[test]
fn native_host_can_create_and_free_state() {
    let state = triangular_source_new(48_000.0);
    assert!(!state.is_null());
    // SAFETY: state was returned by the matching constructor and is freed once.
    unsafe { triangular_source_free(state) }
}
