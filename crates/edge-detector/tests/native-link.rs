//! Link the public DSP API from a separate native test executable.
use edge_detector::{edge_detector_free, edge_detector_new};

#[test]
fn native_host_can_create_and_free_state() {
    let state = edge_detector_new();
    assert!(!state.is_null());
    edge_detector_free(state);
}
