//! Link the public DSP API from a separate native test executable.
use pitch_sync_mod::{pitch_sync_resonator_free, pitch_sync_resonator_new};

#[test]
fn native_host_can_create_and_free_state() {
    let state = pitch_sync_resonator_new(48_000.0);
    assert!(!state.is_null());
    // SAFETY: state was returned by the matching constructor and is freed once.
    unsafe { pitch_sync_resonator_free(state) }
}
