//! Link the public DSP API from a separate native test executable.
use impulsive_source::{impulsive_source_free, impulsive_source_new};

#[test]
fn native_host_can_create_and_free_state() {
    let state = impulsive_source_new(48_000.0);
    assert!(!state.is_null());
    // SAFETY: state was returned by the matching constructor and is freed once.
    unsafe { impulsive_source_free(state) }
}
