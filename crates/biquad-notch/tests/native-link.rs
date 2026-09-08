//! Link the public DSP API from a separate native test executable.
use biquad_notch::{biquad_notch_free, biquad_notch_new};

#[test]
fn native_host_can_create_and_free_state() {
    let state = biquad_notch_new();
    assert!(!state.is_null());
    biquad_notch_free(state);
}
