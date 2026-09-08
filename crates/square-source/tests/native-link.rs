//! Link the public DSP API from a separate native test executable.
use square_source::{square_source_free, square_source_new};

#[test]
fn native_host_can_create_and_free_state() {
    let state = square_source_new(48_000.0);
    assert!(!state.is_null());
    // SAFETY: state was returned by the matching constructor and is freed once.
    unsafe { square_source_free(state) }
}
