//! Link the public DSP API from a separate native test executable.
use aerodynamic_model::{aerodynamic_model_free, aerodynamic_model_new};

#[test]
fn native_host_can_create_and_free_state() {
    let state = aerodynamic_model_new(48_000.0);
    assert!(!state.is_null());
    // SAFETY: state was returned by the matching constructor and is freed once.
    unsafe { aerodynamic_model_free(state) }
}
