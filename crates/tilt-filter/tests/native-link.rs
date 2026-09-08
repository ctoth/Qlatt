//! Link the public DSP API from a separate native test executable.
use tilt_filter::{tilt_filter_free, tilt_filter_new};

#[test]
fn native_host_can_create_and_free_state() {
    let state = tilt_filter_new();
    assert!(!state.is_null());
    // SAFETY: state was returned by the matching constructor and is freed once.
    unsafe { tilt_filter_free(state) }
}
