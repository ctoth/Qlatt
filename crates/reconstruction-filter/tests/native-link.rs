//! Link the public DSP API from a separate native test executable.
use reconstruction_filter::{reconstruction_filter_free, reconstruction_filter_new};

#[test]
fn native_host_can_create_and_free_state() {
    let state = reconstruction_filter_new(48_000.0);
    assert!(!state.is_null());
    // SAFETY: state was returned by the matching constructor and is freed once.
    unsafe { reconstruction_filter_free(state) }
}
