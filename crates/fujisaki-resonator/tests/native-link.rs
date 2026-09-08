//! Link the public DSP API from a separate native test executable.
use fujisaki_resonator::{fujisaki_resonator_free, fujisaki_resonator_new};

#[test]
fn native_host_can_create_and_free_state() {
    let state = fujisaki_resonator_new();
    assert!(!state.is_null());
    fujisaki_resonator_free(state);
}
